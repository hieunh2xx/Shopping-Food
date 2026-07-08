using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Application.Services;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Payments.Queries
{
    public class GetTransactionsQuery : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public int Skip { get; set; } = 0;
        public int Take { get; set; } = 50;
    }

    public class GetTransactionsHandler : IRequestHandler<GetTransactionsQuery, ApiResponse>
    {
        private readonly IPaymentSettlementService _paymentService;
        private readonly IFinancialTransactionRepository _transactionRepository;
        private readonly IWalletRepository _walletRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantRepository;
        private readonly IShipperProfileRepository _shipperRepository;

        public GetTransactionsHandler(
            IPaymentSettlementService paymentService,
            IFinancialTransactionRepository transactionRepository,
            IWalletRepository walletRepository,
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantRepository,
            IShipperProfileRepository shipperRepository)
        {
            _paymentService = paymentService;
            _transactionRepository = transactionRepository;
            _walletRepository = walletRepository;
            _userRepository = userRepository;
            _restaurantRepository = restaurantRepository;
            _shipperRepository = shipperRepository;
        }

        public async Task<ApiResponse> Handle(GetTransactionsQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile));
            var user = users.FirstOrDefault();
            if (user?.Profile == null)
                return ApiResponse.Failure(404, "User not found.");

            var walletIds = new List<Guid>();

            var customerWallet = await _paymentService.GetOrCreateWalletAsync(WalletOwnerType.Customer, request.CurrentUserId.Value);
            walletIds.Add(customerWallet.Id);

            if (user.Profile.Role == UserRole.Seller)
            {
                var restaurants = await _restaurantRepository.GetAsync(predicate: r => r.OwnerId == user.Profile.Id);
                foreach (var r in restaurants)
                {
                    var w = await _paymentService.GetOrCreateWalletAsync(WalletOwnerType.Seller, r.Id);
                    walletIds.Add(w.Id);
                }
            }
            if (user.Profile.Role == UserRole.Shipper)
            {
                var shippers = await _shipperRepository.GetAsync(predicate: s => s.UserProfileId == user.Profile.Id);
                foreach (var s in shippers)
                {
                    var w = await _paymentService.GetOrCreateWalletAsync(WalletOwnerType.Shipper, s.Id);
                    walletIds.Add(w.Id);
                }
            }

            var transactions = await _transactionRepository.GetAsync(
                predicate: t => walletIds.Contains(t.WalletId),
                orderBy: q => q.OrderByDescending(t => t.CreatedAt),
                disableTracking: true);

            var result = transactions.Skip(request.Skip).Take(request.Take).Select(t => new
            {
                t.Id,
                type = t.Type.ToString(),
                t.Amount,
                t.BalanceAfter,
                t.Description,
                t.ReferenceId,
                t.ReferenceType,
                t.CreatedAt
            }).ToList();

            return ApiResponse.Success(result, "Transactions retrieved.");
        }
    }

    public class GetWithdrawalsQuery : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public string? Status { get; set; }
    }

    public class GetWithdrawalsHandler : IRequestHandler<GetWithdrawalsQuery, ApiResponse>
    {
        private readonly IWithdrawalRequestRepository _withdrawalRepository;
        private readonly IUserRepository _userRepository;

        public GetWithdrawalsHandler(IWithdrawalRequestRepository withdrawalRepository, IUserRepository userRepository)
        {
            _withdrawalRepository = withdrawalRepository;
            _userRepository = userRepository;
        }

        public async Task<ApiResponse> Handle(GetWithdrawalsQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile));
            if (users.FirstOrDefault()?.Profile?.Role != UserRole.Admin)
                return ApiResponse.Failure(403, "Forbidden.");

            WithdrawalStatus? statusFilter = null;
            if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<WithdrawalStatus>(request.Status, out var s))
                statusFilter = s;

            var withdrawals = await _withdrawalRepository.GetAsync(
                predicate: w => !statusFilter.HasValue || w.Status == statusFilter.Value,
                include: q => q.Include(w => w.Wallet),
                orderBy: q => q.OrderByDescending(w => w.CreatedAt),
                disableTracking: true);

            var result = withdrawals.Select(w => new
            {
                w.Id,
                w.Amount,
                w.BankName,
                w.BankAccountNumber,
                w.BankAccountHolder,
                status = w.Status.ToString(),
                ownerType = w.Wallet.OwnerType.ToString(),
                w.CreatedAt
            }).ToList();

            return ApiResponse.Success(result, "Withdrawals retrieved.");
        }
    }

    public class GetReconciliationReportQuery : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }

    public class GetReconciliationReportHandler : IRequestHandler<GetReconciliationReportQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IFinancialTransactionRepository _transactionRepository;
        private readonly IPaymentSettlementService _paymentService;
        private readonly IUserRepository _userRepository;

        public GetReconciliationReportHandler(
            IOrderRepository orderRepository,
            IFinancialTransactionRepository transactionRepository,
            IPaymentSettlementService paymentService,
            IUserRepository userRepository)
        {
            _orderRepository = orderRepository;
            _transactionRepository = transactionRepository;
            _paymentService = paymentService;
            _userRepository = userRepository;
        }

        public async Task<ApiResponse> Handle(GetReconciliationReportQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile));
            if (users.FirstOrDefault()?.Profile?.Role != UserRole.Admin)
                return ApiResponse.Failure(403, "Forbidden.");

            var from = request.FromDate ?? DateTime.UtcNow.AddDays(-30);
            var to = request.ToDate ?? DateTime.UtcNow;

            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Status == OrderStatus.Delivered && o.IsFinancialSettled
                    && o.UpdatedAt >= from && o.UpdatedAt <= to,
                disableTracking: true);

            var config = await _paymentService.GetConfigAsync();
            var totalRevenue = orders.Sum(o => o.TotalAmount);
            var totalCommission = orders.Sum(o => o.PlatformCommission);
            var totalSellerPayout = orders.Sum(o => o.SellerPayout);
            var totalShipping = orders.Sum(o => o.ShippingFee);
            var codOrders = orders.Count(o => o.PaymentMethod == PaymentMethod.COD);
            var prepaidOrders = orders.Count(o => o.PaymentMethod != PaymentMethod.COD);

            var transactions = await _transactionRepository.GetAllAsync();
            var recentTx = transactions.Where(t => t.CreatedAt >= from && t.CreatedAt <= to).ToList();

            return ApiResponse.Success(new
            {
                period = new { from, to },
                summary = new
                {
                    totalOrders = orders.Count,
                    totalRevenue,
                    totalCommission,
                    totalSellerPayout,
                    totalShipping,
                    commissionRate = config.CommissionRate,
                    codOrders,
                    prepaidOrders
                },
                transactionCount = recentTx.Count,
                transactionVolume = recentTx.Sum(t => Math.Abs(t.Amount))
            }, "Reconciliation report generated.");
        }
    }

    public class GetPaymentHistoryQuery : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public int Skip { get; set; }
        public int Take { get; set; } = 50;
    }

    public class GetPaymentHistoryHandler : IRequestHandler<GetPaymentHistoryQuery, ApiResponse>
    {
        private readonly IPaymentSessionRepository _sessionRepository;
        private readonly IOrderRepository _orderRepository;

        public GetPaymentHistoryHandler(
            IPaymentSessionRepository sessionRepository,
            IOrderRepository orderRepository)
        {
            _sessionRepository = sessionRepository;
            _orderRepository = orderRepository;
        }

        public async Task<ApiResponse> Handle(GetPaymentHistoryQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var sessions = await _sessionRepository.GetAsync(
                predicate: s => s.UserAccountId == request.CurrentUserId,
                orderBy: q => q.OrderByDescending(s => s.CreatedAt),
                disableTracking: true);

            var items = sessions.Skip(request.Skip).Take(request.Take).Select(s =>
            {
                var remaining = Math.Max(0, (int)(s.ExpiresAt - DateTime.UtcNow).TotalSeconds);
                var display = PaymentDisplayStatus.Resolve(s, null, remaining);
                return new
                {
                    paymentId = s.Id,
                    s.InvoiceNumber,
                    s.Amount,
                    displayStatus = display.Code,
                    statusLabel = display.Label,
                    status = display.Code,
                    paymentMethod = s.PaymentMethod.ToString(),
                    s.OrderId,
                    s.CreatedAt,
                    s.ExpiresAt,
                    s.ExternalTransactionId,
                    isPaid = PaymentSessionStatusHelper.IsWebhookConfirmed(s)
                };
            }).ToList();

            return ApiResponse.Success(new { total = sessions.Count, items }, "Payment history.");
        }
    }

    public class GetPaymentDashboardQuery : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }

    public class GetPaymentDashboardHandler : IRequestHandler<GetPaymentDashboardQuery, ApiResponse>
    {
        private readonly IPaymentSessionRepository _sessionRepository;
        private readonly ISepayWebhookLogRepository _webhookLogRepository;
        private readonly IPaymentMessageQueue _queue;
        private readonly IUserRepository _userRepository;

        public GetPaymentDashboardHandler(
            IPaymentSessionRepository sessionRepository,
            ISepayWebhookLogRepository webhookLogRepository,
            IPaymentMessageQueue queue,
            IUserRepository userRepository)
        {
            _sessionRepository = sessionRepository;
            _webhookLogRepository = webhookLogRepository;
            _queue = queue;
            _userRepository = userRepository;
        }

        public async Task<ApiResponse> Handle(GetPaymentDashboardQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile));
            if (users.FirstOrDefault()?.Profile?.Role != UserRole.Admin)
                return ApiResponse.Failure(403, "Forbidden.");

            var from = request.FromDate ?? DateTime.UtcNow.AddDays(-7);
            var to = request.ToDate ?? DateTime.UtcNow;

            var sessions = await _sessionRepository.GetAsync(
                predicate: s => s.CreatedAt >= from && s.CreatedAt <= to,
                disableTracking: true);

            var webhooks = await _webhookLogRepository.GetAsync(
                predicate: l => l.CreatedAt >= from && l.CreatedAt <= to,
                disableTracking: true);

            return ApiResponse.Success(new
            {
                period = new { from, to },
                summary = new
                {
                    totalSessions = sessions.Count,
                    paid = sessions.Count(s => s.Status == PaymentSessionStatus.Completed),
                    pending = sessions.Count(s => s.Status == PaymentSessionStatus.Pending),
                    expired = sessions.Count(s => s.Status == PaymentSessionStatus.Expired),
                    failed = sessions.Count(s => s.Status == PaymentSessionStatus.Failed),
                    totalVolume = sessions.Where(s => s.Status == PaymentSessionStatus.Completed).Sum(s => s.Amount),
                    sepayCount = sessions.Count(s => s.PaymentMethod == PaymentMethod.Sepay),
                    queuePending = _queue.PendingCount,
                    webhooksReceived = webhooks.Count,
                    webhooksProcessed = webhooks.Count(w => w.IsProcessed)
                },
                recentSessions = sessions.OrderByDescending(s => s.CreatedAt).Take(20).Select(s => new
                {
                    paymentId = s.Id,
                    s.InvoiceNumber,
                    s.Amount,
                    status = s.Status.ToString(),
                    paymentMethod = s.PaymentMethod.ToString(),
                    s.OrderId,
                    s.CreatedAt,
                    s.ExpiresAt
                }),
                recentWebhooks = webhooks.OrderByDescending(w => w.CreatedAt).Take(10).Select(w => new
                {
                    w.Id,
                    w.EventKey,
                    w.EventType,
                    w.IsProcessed,
                    w.ProcessedAt,
                    w.CreatedAt
                })
            }, "Payment dashboard.");
        }
    }
}
