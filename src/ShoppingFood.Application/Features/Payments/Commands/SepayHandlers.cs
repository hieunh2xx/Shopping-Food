using MediatR;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Application.Models;
using ShoppingFood.Application.Services;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Payments.Commands
{
    public class GetSepayQrQuery : IRequest<ApiResponse>
    {
        public Guid SessionId { get; set; }
        public Guid? CurrentUserId { get; set; }
    }

    public class GetSepayQrHandler : IRequestHandler<GetSepayQrQuery, ApiResponse>
    {
        private readonly IPaymentSessionRepository _sessionRepository;
        private readonly IPaymentCacheService _cache;
        private readonly ISepayService _sepayService;
        private readonly ISepayBankAccountResolver _bankAccountResolver;
        private readonly IOrderRepository _orderRepository;

        public GetSepayQrHandler(
            IPaymentSessionRepository sessionRepository,
            IPaymentCacheService cache,
            ISepayService sepayService,
            ISepayBankAccountResolver bankAccountResolver,
            IOrderRepository orderRepository)
        {
            _sessionRepository = sessionRepository;
            _cache = cache;
            _sepayService = sepayService;
            _bankAccountResolver = bankAccountResolver;
            _orderRepository = orderRepository;
        }

        public async Task<ApiResponse> Handle(GetSepayQrQuery request, CancellationToken cancellationToken)
        {
            if (!_sepayService.IsEnabled)
                return ApiResponse.Failure(503, "SePay chưa được cấu hình.");

            var sessions = await _sessionRepository.GetAsync(predicate: s => s.Id == request.SessionId);
            var session = sessions.FirstOrDefault();
            if (session == null) return ApiResponse.Failure(404, "Phiên thanh toán không tồn tại.");
            if (session.PaymentMethod != PaymentMethod.Sepay)
                return ApiResponse.Failure(400, "Không phải phiên SePay.");
            if (request.CurrentUserId.HasValue && session.UserAccountId != request.CurrentUserId)
                return ApiResponse.Failure(403, "Forbidden.");

            var cached = _cache.GetByPaymentId(session.Id);
            var isExpired = session.Status == PaymentSessionStatus.Expired
                || session.ExpiresAt < DateTime.UtcNow;

            if (isExpired && session.Status == PaymentSessionStatus.Pending)
                return ApiResponse.Failure(410, "Mã QR đã hết hạn (10 phút). Vui lòng tạo đơn mới.");

            var bank = await _bankAccountResolver.ResolveAsync(cancellationToken);
            var qrUrl = !string.IsNullOrEmpty(cached?.QrImageUrl)
                ? cached!.QrImageUrl
                : bank != null
                    ? _sepayService.BuildQrImageUrl(session.InvoiceNumber!, session.Amount, bank)
                    : string.Empty;

            if (string.IsNullOrEmpty(qrUrl))
                return ApiResponse.Failure(503,
                    "Chưa cấu hình tài khoản ngân hàng cho QR. Điền Sepay:BankAccountNumber trong appsettings hoặc Sepay:ApiBearerToken (my.sepay.vn → API Token).");

            var remaining = Math.Max(0, (int)(session.ExpiresAt - DateTime.UtcNow).TotalSeconds);
            var isPaid = PaymentSessionStatusHelper.IsWebhookConfirmed(session);
            var transferContent = _sepayService.BuildTransferContent(session.InvoiceNumber!);

            decimal? itemsSubtotal = null;
            decimal? shippingFee = null;
            if (session.OrderId.HasValue)
            {
                var order = await _orderRepository.GetByIdAsync(session.OrderId.Value);
                if (order != null)
                {
                    itemsSubtotal = order.ItemsSubtotal > 0 ? order.ItemsSubtotal : order.TotalAmount - order.ShippingFee;
                    shippingFee = order.ShippingFee;
                }
            }

            return ApiResponse.Success(new
            {
                paymentId = session.Id,
                sessionId = session.Id,
                invoiceNumber = session.InvoiceNumber,
                transferContent,
                amount = session.Amount,
                itemsSubtotal,
                shippingFee,
                status = session.Status.ToString(),
                qrImageUrl = qrUrl,
                bankName = bank?.BankName,
                bankAccountNumber = bank?.AccountNumber,
                accountHolder = bank?.AccountHolder,
                expiresAt = session.ExpiresAt,
                remainingSeconds = remaining,
                isExpired,
                isPaid,
                awaitingWebhook = PaymentSessionStatusHelper.IsAwaitingWebhook(session, remaining),
                isProcessing = cached?.Status == "Processing",
                orderId = session.OrderId
            }, "QR payment info.");
        }
    }

    public class GetSepayCheckoutQuery : IRequest<ApiResponse>
    {
        public Guid SessionId { get; set; }
        public Guid? CurrentUserId { get; set; }
        public string? PaymentMethod { get; set; }
    }

    public class GetSepayCheckoutHandler : IRequestHandler<GetSepayCheckoutQuery, ApiResponse>
    {
        private readonly IPaymentSessionRepository _sessionRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly ISepayService _sepayService;

        public GetSepayCheckoutHandler(
            IPaymentSessionRepository sessionRepository,
            IOrderRepository orderRepository,
            ISepayService sepayService)
        {
            _sessionRepository = sessionRepository;
            _orderRepository = orderRepository;
            _sepayService = sepayService;
        }

        public async Task<ApiResponse> Handle(GetSepayCheckoutQuery request, CancellationToken cancellationToken)
        {
            if (!_sepayService.IsEnabled)
                return ApiResponse.Failure(503, "SePay chưa được cấu hình.");

            var sessions = await _sessionRepository.GetAsync(predicate: s => s.Id == request.SessionId);
            var session = sessions.FirstOrDefault();
            if (session == null) return ApiResponse.Failure(404, "Phiên thanh toán không tồn tại.");
            if (session.Status != PaymentSessionStatus.Pending)
                return ApiResponse.Failure(400, "Phiên thanh toán đã được xử lý.");
            if (session.ExpiresAt < DateTime.UtcNow)
                return ApiResponse.Failure(410, "Phiên thanh toán đã hết hạn.");

            if (request.CurrentUserId.HasValue && session.UserAccountId != request.CurrentUserId)
                return ApiResponse.Failure(403, "Forbidden.");

            var order = session.OrderId.HasValue
                ? await _orderRepository.GetByIdAsync(session.OrderId.Value)
                : null;
            var description = order != null
                ? $"Thanh toan don hang {order.Id}"
                : $"Thanh toan {session.InvoiceNumber}";

            var form = _sepayService.BuildCheckoutForm(
                session.InvoiceNumber!, session.Amount, description,
                session.UserAccountId?.ToString(), request.PaymentMethod);

            return ApiResponse.Success(new
            {
                sessionId = session.Id,
                invoiceNumber = session.InvoiceNumber,
                amount = session.Amount,
                checkoutUrl = form.CheckoutUrl,
                method = form.Method,
                fields = form.Fields
            }, "SePay checkout form ready.");
        }
    }

    public class GetPaymentSessionStatusQuery : IRequest<ApiResponse>
    {
        public Guid? SessionId { get; set; }
        public string? InvoiceNumber { get; set; }
        public Guid? CurrentUserId { get; set; }
    }

    public class GetPaymentSessionStatusHandler : IRequestHandler<GetPaymentSessionStatusQuery, ApiResponse>
    {
        private readonly IPaymentSessionRepository _sessionRepository;
        private readonly IPaymentCacheService _cache;
        private readonly ISepayService _sepayService;
        private readonly IOrderRepository _orderRepository;

        public GetPaymentSessionStatusHandler(
            IPaymentSessionRepository sessionRepository,
            IPaymentCacheService cache,
            ISepayService sepayService,
            IOrderRepository orderRepository)
        {
            _sessionRepository = sessionRepository;
            _cache = cache;
            _sepayService = sepayService;
            _orderRepository = orderRepository;
        }

        public async Task<ApiResponse> Handle(GetPaymentSessionStatusQuery request, CancellationToken cancellationToken)
        {
            var resolvedInvoice = !string.IsNullOrEmpty(request.InvoiceNumber)
                ? _sepayService.ResolveInvoiceFromTransferCode(request.InvoiceNumber) ?? request.InvoiceNumber.Trim()
                : null;

            var sessions = await _sessionRepository.GetAsync(predicate: s =>
                (request.SessionId.HasValue && s.Id == request.SessionId.Value) ||
                (resolvedInvoice != null && s.InvoiceNumber == resolvedInvoice));

            var session = sessions.FirstOrDefault();
            if (session == null) return ApiResponse.Failure(404, "Phiên thanh toán không tồn tại.");

            if (request.CurrentUserId.HasValue && session.UserAccountId != request.CurrentUserId)
                return ApiResponse.Failure(403, "Forbidden.");

            var cached = _cache.GetByPaymentId(session.Id);
            var remaining = Math.Max(0, (int)(session.ExpiresAt - DateTime.UtcNow).TotalSeconds);
            var isPaid = PaymentSessionStatusHelper.IsWebhookConfirmed(session);

            decimal? itemsSubtotal = null;
            decimal? shippingFee = null;
            if (session.OrderId.HasValue)
            {
                var orders = await _orderRepository.GetAsync(
                    predicate: o => o.Id == session.OrderId.Value,
                    disableTracking: true);
                var order = orders.FirstOrDefault();
                if (order != null)
                {
                    itemsSubtotal = order.ItemsSubtotal > 0 ? order.ItemsSubtotal : order.TotalAmount - order.ShippingFee;
                    shippingFee = order.ShippingFee;
                }
            }

            return ApiResponse.Success(new
            {
                paymentId = session.Id,
                sessionId = session.Id,
                invoiceNumber = session.InvoiceNumber,
                transferContent = session.InvoiceNumber != null
                    ? _sepayService.BuildTransferContent(session.InvoiceNumber)
                    : null,
                amount = session.Amount,
                itemsSubtotal,
                shippingFee,
                status = cached?.Status ?? session.Status.ToString(),
                orderId = session.OrderId,
                paymentMethod = session.PaymentMethod.ToString(),
                isPaid,
                awaitingWebhook = PaymentSessionStatusHelper.IsAwaitingWebhook(session, remaining),
                isProcessing = cached?.Status == "Processing",
                isExpired = session.Status == PaymentSessionStatus.Expired || remaining == 0,
                expiresAt = session.ExpiresAt,
                remainingSeconds = remaining,
                qrImageUrl = cached?.QrImageUrl,
                externalTransactionId = session.ExternalTransactionId,
                message = isPaid
                    ? "Thanh toán SePay đã được xác nhận qua webhook."
                    : PaymentSessionStatusHelper.IsAwaitingWebhook(session, remaining)
                        ? "Đang chờ SePay/ngân hàng gửi webhook xác nhận."
                        : session.Status == PaymentSessionStatus.Expired || remaining == 0
                            ? "Phiên thanh toán đã hết hạn."
                            : "Chưa nhận được xác nhận thanh toán."
            });
        }
    }

    public class ProcessSepayIpnCommand : IRequest<ApiResponse>
    {
        public string RawBody { get; set; } = string.Empty;
        public string? SecretHeader { get; set; }
    }

    public class ProcessSepayIpnHandler : IRequestHandler<ProcessSepayIpnCommand, ApiResponse>
    {
        private readonly ISepayService _sepayService;
        private readonly ISepayWebhookLogRepository _webhookLogRepository;
        private readonly IPaymentOrchestrationService _orchestration;

        public ProcessSepayIpnHandler(
            ISepayService sepayService,
            ISepayWebhookLogRepository webhookLogRepository,
            IPaymentOrchestrationService orchestration)
        {
            _sepayService = sepayService;
            _webhookLogRepository = webhookLogRepository;
            _orchestration = orchestration;
        }

        public async Task<ApiResponse> Handle(ProcessSepayIpnCommand request, CancellationToken cancellationToken)
        {
            if (!_sepayService.VerifyIpnSecret(request.SecretHeader))
                return ApiResponse.Failure(401, "Unauthorized IPN.");

            JObject data;
            try { data = JObject.Parse(request.RawBody); }
            catch { return ApiResponse.Failure(400, "Invalid JSON."); }

            var notificationType = data["notification_type"]?.ToString() ?? "";
            var orderNode = data["order"] as JObject;
            var invoiceNumber = orderNode?["order_invoice_number"]?.ToString();
            var sepayOrderId = orderNode?["order_id"]?.ToString();
            var orderAmount = orderNode?["order_amount"]?.ToString();

            var eventKey = $"ipn:{notificationType}:{sepayOrderId ?? invoiceNumber ?? Guid.NewGuid().ToString()}";
            if (await IsDuplicateAsync(eventKey))
                return ApiResponse.Success(new { duplicate = true }, "Already processed.");

            PaymentConfirmationMessage? confirmation = null;
            if (notificationType == "ORDER_PAID" && !string.IsNullOrWhiteSpace(invoiceNumber)
                && decimal.TryParse(orderAmount, out var amt))
            {
                confirmation = new PaymentConfirmationMessage
                {
                    EventKey = eventKey,
                    InvoiceNumber = invoiceNumber,
                    Amount = amt,
                    Source = "IPN",
                    ExternalTransactionId = data["transaction"]?["transaction_id"]?.ToString() ?? sepayOrderId
                };
            }

            await _orchestration.PersistWebhookAndEnqueueAsync(
                eventKey, notificationType, request.RawBody, confirmation);

            return ApiResponse.Success(new { queued = confirmation != null }, "IPN accepted.");
        }

        private async Task<bool> IsDuplicateAsync(string eventKey)
        {
            var existing = await _webhookLogRepository.GetAsync(predicate: l => l.EventKey == eventKey);
            return existing.Any();
        }
    }

    public class ProcessSepayBankWebhookCommand : IRequest<ApiResponse>
    {
        public string RawBody { get; set; } = string.Empty;
        public string? AuthorizationHeader { get; set; }
        public string? SignatureHeader { get; set; }
        public string? TimestampHeader { get; set; }
    }

    public class ProcessSepayBankWebhookHandler : IRequestHandler<ProcessSepayBankWebhookCommand, ApiResponse>
    {
        private readonly ISepayService _sepayService;
        private readonly ISepayWebhookLogRepository _webhookLogRepository;
        private readonly IPaymentOrchestrationService _orchestration;

        public ProcessSepayBankWebhookHandler(
            ISepayService sepayService,
            ISepayWebhookLogRepository webhookLogRepository,
            IPaymentOrchestrationService orchestration)
        {
            _sepayService = sepayService;
            _webhookLogRepository = webhookLogRepository;
            _orchestration = orchestration;
        }

        public async Task<ApiResponse> Handle(ProcessSepayBankWebhookCommand request, CancellationToken cancellationToken)
        {
            if (!_sepayService.VerifyWebhookAuth(
                    request.AuthorizationHeader,
                    request.RawBody,
                    request.SignatureHeader,
                    request.TimestampHeader))
                return ApiResponse.Failure(401, "Unauthorized webhook.");

            JObject data;
            try { data = JObject.Parse(request.RawBody); }
            catch { return ApiResponse.Failure(400, "Invalid JSON."); }

            var sepayId = data["id"]?.ToString() ?? "";
            var eventKey = $"wh:{sepayId}";
            if (string.IsNullOrEmpty(sepayId) || await IsDuplicateAsync(eventKey))
                return ApiResponse.Success(new { duplicate = true }, "Already processed.");

            PaymentConfirmationMessage? confirmation = null;
            var transferType = data["transferType"]?.ToString();
            var code = data["code"]?.Type == Newtonsoft.Json.Linq.JTokenType.Null
                ? null
                : data["code"]?.ToString();
            if (string.IsNullOrWhiteSpace(code))
                code = data["content"]?.ToString();
            var amount = data["transferAmount"]?.Value<decimal?>();
            var isIncoming = string.Equals(transferType, "in", StringComparison.OrdinalIgnoreCase)
                || (string.IsNullOrWhiteSpace(transferType) && amount is > 0);

            string? skippedReason = null;
            if (transferType == "out")
                skippedReason = "outgoing_transfer";
            else if (string.IsNullOrWhiteSpace(code))
                skippedReason = "missing_code_and_content";
            else if (!amount.HasValue)
                skippedReason = "missing_amount";

            if (isIncoming && !string.IsNullOrWhiteSpace(code) && amount.HasValue)
            {
                var invoiceFromCode = _sepayService.ResolveInvoiceFromTransferCode(code) ?? code.Trim();
                confirmation = new PaymentConfirmationMessage
                {
                    EventKey = eventKey,
                    InvoiceNumber = invoiceFromCode,
                    Amount = amount.Value,
                    Source = "Webhook",
                    ExternalTransactionId = data["referenceCode"]?.ToString() ?? sepayId
                };
            }

            await _orchestration.PersistWebhookAndEnqueueAsync(
                eventKey, transferType ?? "bank", request.RawBody, confirmation);

            return ApiResponse.Success(new
            {
                queued = confirmation != null,
                invoiceNumber = confirmation?.InvoiceNumber,
                amount = confirmation?.Amount,
                skippedReason
            }, confirmation != null ? "Webhook accepted and queued." : "Webhook accepted (no matching payment code).");
        }

        private async Task<bool> IsDuplicateAsync(string eventKey)
        {
            var existing = await _webhookLogRepository.GetAsync(predicate: l => l.EventKey == eventKey);
            return existing.Any();
        }
    }
}
