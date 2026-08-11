using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Application.Models;
using ShoppingFood.Application.Options;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Services
{
    public class PaymentOrchestrationService : IPaymentOrchestrationService
    {
        private readonly IPaymentCacheService _cache;
        private readonly IPaymentMessageQueue _queue;
        private readonly IPaymentSessionRepository _sessionRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly ISepayWebhookLogRepository _webhookLogRepository;
        private readonly IPaymentSettlementService _paymentService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ISepayService _sepayService;
        private readonly ISepayTransactionApiClient _transactionApi;
        private readonly IMemoryCache _memoryCache;
        private readonly SepayOptions _options;

        public PaymentOrchestrationService(
            IPaymentCacheService cache,
            IPaymentMessageQueue queue,
            IPaymentSessionRepository sessionRepository,
            IOrderRepository orderRepository,
            ISepayWebhookLogRepository webhookLogRepository,
            IPaymentSettlementService paymentService,
            IUnitOfWork unitOfWork,
            ISepayService sepayService,
            ISepayTransactionApiClient transactionApi,
            IMemoryCache memoryCache,
            IOptions<SepayOptions> options)
        {
            _cache = cache;
            _queue = queue;
            _sessionRepository = sessionRepository;
            _orderRepository = orderRepository;
            _webhookLogRepository = webhookLogRepository;
            _paymentService = paymentService;
            _unitOfWork = unitOfWork;
            _sepayService = sepayService;
            _transactionApi = transactionApi;
            _memoryCache = memoryCache;
            _options = options.Value;
        }

        public Task RegisterPaymentCacheAsync(PaymentSession session, string? qrImageUrl = null)
        {
            _cache.Set(new PaymentCacheEntry
            {
                PaymentId = session.Id,
                InvoiceNumber = session.InvoiceNumber ?? string.Empty,
                Amount = session.Amount,
                OrderId = session.OrderId,
                UserId = session.UserAccountId,
                Status = session.Status.ToString(),
                CreatedAt = session.CreatedAt,
                ExpiresAt = session.ExpiresAt,
                QrImageUrl = qrImageUrl
            });
            return Task.CompletedTask;
        }

        public async Task<Guid> PersistWebhookAndEnqueueAsync(
            string eventKey,
            string eventType,
            string rawPayload,
            PaymentConfirmationMessage? confirmation = null)
        {
            var log = new SepayWebhookLog
            {
                Id = Guid.NewGuid(),
                EventKey = eventKey,
                EventType = eventType,
                RawPayload = rawPayload,
                IsProcessed = false,
                CreatedAt = DateTime.UtcNow
            };
            _webhookLogRepository.Add(log);
            await _unitOfWork.SaveChangesAsync();

            if (confirmation != null)
            {
                confirmation.WebhookLogId = log.Id;
                await _queue.EnqueueAsync(confirmation);
            }

            return log.Id;
        }

        public async Task<bool> ProcessConfirmationAsync(PaymentConfirmationMessage message)
        {
            var sessions = await _sessionRepository.GetAsync(
                predicate: s => s.InvoiceNumber == message.InvoiceNumber,
                disableTracking: false);
            var session = sessions.FirstOrDefault();
            if (session == null) return false;

            if (session.Status == PaymentSessionStatus.Completed)
            {
                await MarkWebhookProcessedAsync(message.WebhookLogId, session.Id);
                _cache.UpdateStatus(session.Id, "Paid");
                return true;
            }

            if (session.Status == PaymentSessionStatus.Expired)
                return false;

            if (session.ExpiresAt < DateTime.UtcNow)
            {
                session.Status = PaymentSessionStatus.Expired;
                session.UpdatedAt = DateTime.UtcNow;
                _sessionRepository.Update(session);
                _cache.UpdateStatus(session.Id, "Expired");
                await _unitOfWork.SaveChangesAsync();
                return false;
            }

            if (Math.Abs(message.Amount - session.Amount) > 1)
                return false;

            _cache.UpdateStatus(session.Id, "Processing");

            var confirmed = await _paymentService.ConfirmPaymentSessionByInvoiceAsync(
                message.InvoiceNumber, message.Amount, message.ExternalTransactionId);

            if (confirmed)
            {
                session.SepayOrderId ??= message.ExternalTransactionId;
                session.UpdatedAt = DateTime.UtcNow;
                _sessionRepository.Update(session);
                _cache.UpdateStatus(session.Id, "Paid");
                await MarkWebhookProcessedAsync(message.WebhookLogId, session.Id);
                await _unitOfWork.SaveChangesAsync();
                return true;
            }

            return false;
        }

        public async Task<SepayReconcileResult> TryReconcileSessionAsync(
            Guid sessionId,
            CancellationToken cancellationToken = default)
        {
            var cooldownKey = $"sepay:reconcile:cooldown:{sessionId}";
            if (_memoryCache.TryGetValue(cooldownKey, out _))
                return SepayReconcileResult.SkippedCooldown();

            _memoryCache.Set(cooldownKey, true, TimeSpan.FromSeconds(30));

            var sessions = await _sessionRepository.GetAsync(
                predicate: s => s.Id == sessionId,
                disableTracking: false);
            var session = sessions.FirstOrDefault();
            if (session == null)
                return SepayReconcileResult.NotFound("Không tìm thấy phiên thanh toán.");

            if (session.PaymentMethod != PaymentMethod.Sepay)
                return SepayReconcileResult.NotFound("Phiên không phải SePay.");

            if (PaymentSessionStatusHelper.IsWebhookConfirmed(session))
            {
                _cache.UpdateStatus(session.Id, "Paid");
                return SepayReconcileResult.AlreadyConfirmed();
            }

            if (!_transactionApi.IsConfigured)
                return SepayReconcileResult.NotFound("Chưa cấu hình Sepay:ApiBearerToken để đồng bộ giao dịch.");

            if (string.IsNullOrWhiteSpace(session.InvoiceNumber))
                return SepayReconcileResult.NotFound("Phiên thiếu mã hóa đơn.");

            var transferContent = _sepayService.BuildTransferContent(session.InvoiceNumber);
            var searchTerms = new[] { session.InvoiceNumber, transferContent }
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Distinct(StringComparer.OrdinalIgnoreCase);

            var fromUtc = session.CreatedAt.AddMinutes(-5);
            var toUtc = DateTime.UtcNow.AddHours(1);
            var allowExpired = session.Status == PaymentSessionStatus.Expired
                || session.ExpiresAt < DateTime.UtcNow;

            foreach (var term in searchTerms)
            {
                var transactions = await _transactionApi.SearchIncomingTransactionsAsync(
                    term,
                    session.Amount,
                    fromUtc,
                    toUtc,
                    cancellationToken);

                foreach (var tx in transactions)
                {
                    if (!string.Equals(tx.TransferType, "in", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (Math.Abs(tx.AmountIn - session.Amount) > 1)
                        continue;

                    var rawCode = tx.Code ?? tx.TransactionContent ?? tx.ReferenceNumber;
                    var resolved = _sepayService.ResolveInvoiceFromTransferCode(rawCode ?? string.Empty);
                    if (!string.Equals(resolved, session.InvoiceNumber, StringComparison.OrdinalIgnoreCase))
                        continue;

                    var externalId = tx.ReferenceNumber ?? tx.Id;
                    var message = new PaymentConfirmationMessage
                    {
                        EventKey = $"reconcile:{tx.Id}",
                        InvoiceNumber = session.InvoiceNumber,
                        Amount = tx.AmountIn,
                        Source = "SePay-API-Reconcile",
                        ExternalTransactionId = externalId
                    };

                    if (allowExpired)
                    {
                        var confirmed = await _paymentService.ConfirmPaymentSessionByInvoiceAsync(
                            session.InvoiceNumber,
                            tx.AmountIn,
                            externalId,
                            allowExpired: true);

                        if (confirmed)
                        {
                            session.ExternalTransactionId ??= externalId;
                            session.SepayOrderId ??= externalId;
                            session.UpdatedAt = DateTime.UtcNow;
                            _sessionRepository.Update(session);
                            _cache.UpdateStatus(session.Id, "Paid");
                            await _unitOfWork.SaveChangesAsync();
                            return SepayReconcileResult.Confirmed(externalId);
                        }
                    }
                    else
                    {
                        var ok = await ProcessConfirmationAsync(message);
                        if (ok)
                            return SepayReconcileResult.Confirmed(externalId);
                    }
                }
            }

            return SepayReconcileResult.NotFound(
                allowExpired
                    ? "Chưa thấy giao dịch khớp trên SePay (có thể chưa chuyển khoản hoặc nội dung/số tiền sai)."
                    : "Chưa thấy giao dịch khớp trên SePay. Hệ thống sẽ thử lại tự động.");
        }

        public async Task<int> ReconcileAllPendingSepaySessionsAsync(CancellationToken cancellationToken = default)
        {
            var cutoff = DateTime.UtcNow.AddHours(-24);
            var sessions = await _sessionRepository.GetAsync(
                predicate: s => s.PaymentMethod == PaymentMethod.Sepay
                    && s.CreatedAt >= cutoff
                    && (s.Status == PaymentSessionStatus.Pending || s.Status == PaymentSessionStatus.Expired),
                orderBy: q => q.OrderBy(s => s.CreatedAt),
                disableTracking: true);

            var confirmed = 0;
            foreach (var session in sessions)
            {
                if (PaymentSessionStatusHelper.IsWebhookConfirmed(session))
                    continue;

                var result = await TryReconcileSessionAsync(session.Id, cancellationToken);
                if (result.Success && result.MatchedOnSepay)
                    confirmed++;
            }

            return confirmed;
        }

        public async Task ExpireStaleSessionsAsync()
        {
            var now = DateTime.UtcNow;
            var sessions = await _sessionRepository.GetAsync(
                predicate: s => s.Status == PaymentSessionStatus.Pending && s.ExpiresAt < now,
                disableTracking: false);

            foreach (var session in sessions)
            {
                session.Status = PaymentSessionStatus.Expired;
                session.UpdatedAt = now;
                _sessionRepository.Update(session);
                _cache.UpdateStatus(session.Id, "Expired");

                await CancelUnpaidSepayOrderIfNeededAsync(session, now, "[Payment Expired] Hết hạn thanh toán SePay (chưa nhận được chuyển khoản).");
            }

            // Dọn zombie: session đã Expired trước đó nhưng đơn vẫn Pending chưa trả
            var staleExpired = await _sessionRepository.GetAsync(
                predicate: s => s.Status == PaymentSessionStatus.Expired
                    && s.PaymentMethod == PaymentMethod.Sepay
                    && s.OrderId.HasValue
                    && s.ExpiresAt < now.AddMinutes(-1),
                disableTracking: false);

            foreach (var session in staleExpired)
            {
                if (PaymentSessionStatusHelper.IsWebhookConfirmed(session))
                    continue;
                await CancelUnpaidSepayOrderIfNeededAsync(session, now, "[Payment Expired] Hết hạn thanh toán SePay (chưa nhận được chuyển khoản).");
            }

            if (sessions.Any() || staleExpired.Any())
                await _unitOfWork.SaveChangesAsync();
        }

        private async Task CancelUnpaidSepayOrderIfNeededAsync(PaymentSession session, DateTime now, string reason)
        {
            if (!session.OrderId.HasValue || session.PaymentMethod != PaymentMethod.Sepay)
                return;

            if (PaymentSessionStatusHelper.IsWebhookConfirmed(session))
                return;

            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == session.OrderId.Value
                    && o.Status == OrderStatus.Pending
                    && o.PaymentStatus == PaymentStatus.Pending,
                disableTracking: false);
            var order = orders.FirstOrDefault();
            if (order == null) return;

            order.Status = OrderStatus.Cancelled;
            order.PaymentStatus = PaymentStatus.Failed;
            order.RejectReason = reason;
            order.UpdatedAt = now;
            _orderRepository.Update(order);
        }

        public async Task ReplayUnprocessedWebhooksAsync()
        {
            var logs = await _webhookLogRepository.GetAsync(
                predicate: l => !l.IsProcessed,
                orderBy: q => q.OrderBy(l => l.CreatedAt),
                disableTracking: true);

            foreach (var log in logs)
            {
                try
                {
                    var payload = Newtonsoft.Json.Linq.JObject.Parse(log.RawPayload);
                    PaymentConfirmationMessage? msg = null;

                    if (log.EventKey.StartsWith("ipn:", StringComparison.Ordinal))
                    {
                        var invoice = payload["order"]?["order_invoice_number"]?.ToString();
                        var amountStr = payload["order"]?["order_amount"]?.ToString();
                        if (!string.IsNullOrEmpty(invoice) && decimal.TryParse(amountStr, out var amt))
                        {
                            msg = new PaymentConfirmationMessage
                            {
                                EventKey = log.EventKey,
                                InvoiceNumber = invoice,
                                Amount = amt,
                                Source = "Replay-IPN",
                                ExternalTransactionId = payload["transaction"]?["transaction_id"]?.ToString(),
                                WebhookLogId = log.Id
                            };
                        }
                    }
                    else if (log.EventKey.StartsWith("wh:", StringComparison.Ordinal))
                    {
                        var code = payload["code"]?.Type == Newtonsoft.Json.Linq.JTokenType.Null
                            ? null
                            : payload["code"]?.ToString();
                        if (string.IsNullOrWhiteSpace(code))
                            code = payload["content"]?.ToString();
                        var amount = payload["transferAmount"]?.ToObject<decimal?>();
                        if (!string.IsNullOrEmpty(code) && amount.HasValue)
                        {
                            var invoiceFromCode = _sepayService.ResolveInvoiceFromTransferCode(code) ?? code.Trim();
                            msg = new PaymentConfirmationMessage
                            {
                                EventKey = log.EventKey,
                                InvoiceNumber = invoiceFromCode,
                                Amount = amount.Value,
                                Source = "Replay-Webhook",
                                ExternalTransactionId = payload["referenceCode"]?.ToString(),
                                WebhookLogId = log.Id
                            };
                        }
                    }

                    if (msg != null)
                        await _queue.EnqueueAsync(msg);
                }
                catch
                {
                    // skip malformed payloads
                }
            }
        }

        private async Task MarkWebhookProcessedAsync(Guid? webhookLogId, Guid sessionId)
        {
            if (!webhookLogId.HasValue) return;

            var logs = await _webhookLogRepository.GetAsync(
                predicate: l => l.Id == webhookLogId.Value,
                disableTracking: false);
            var log = logs.FirstOrDefault();
            if (log == null) return;

            log.IsProcessed = true;
            log.ProcessedAt = DateTime.UtcNow;
            log.PaymentSessionId = sessionId;
            _webhookLogRepository.Update(log);
        }
    }
}
