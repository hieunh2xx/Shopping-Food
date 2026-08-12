using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Application.Services;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;

namespace ShoppingFood.Application.Features.Payments.Queries
{
    public class GetTransactionsQuery : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public int Skip { get; set; } = 0;
        public int Take { get; set; } = 10;
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        /// <summary>Optional: CodCollection, CodRemittance, ShipperEarning, etc.</summary>
        public string? Type { get; set; }
        /// <summary>When true, only COD-related types (CodCollection, CodRemittance).</summary>
        public bool? CodOnly { get; set; }
        /// <summary>When true, exclude COD ledger rows (for wallet earning history separate from debt history).</summary>
        public bool? ExcludeCod { get; set; }
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

            // Chỉ lấy ví đúng vai trò — tránh gộp ví khách + ví tài xế khiến lịch sử bị chồng.
            if (user.Profile.Role == UserRole.Seller || user.Profile.Role == UserRole.Mall)
            {
                var restaurants = await _restaurantRepository.GetAsync(predicate: r => r.OwnerId == user.Profile.Id);
                foreach (var r in restaurants)
                {
                    var w = await _paymentService.GetOrCreateWalletAsync(WalletOwnerType.Seller, r.Id);
                    walletIds.Add(w.Id);
                }
            }
            else if (user.Profile.Role == UserRole.Shipper)
            {
                var shippers = await _shipperRepository.GetAsync(predicate: s => s.UserProfileId == user.Profile.Id);
                foreach (var s in shippers)
                {
                    var w = await _paymentService.GetOrCreateWalletAsync(WalletOwnerType.Shipper, s.Id);
                    walletIds.Add(w.Id);
                }
            }
            else
            {
                var customerWallet = await _paymentService.GetOrCreateWalletAsync(WalletOwnerType.Customer, request.CurrentUserId.Value);
                walletIds.Add(customerWallet.Id);
            }

            FinancialTransactionType? typeFilter = null;
            if (!string.IsNullOrWhiteSpace(request.Type) &&
                Enum.TryParse<FinancialTransactionType>(request.Type, true, out var parsedType))
            {
                typeFilter = parsedType;
            }

            var skip = Math.Max(0, request.Skip);
            var take = request.Take <= 0 ? 10 : Math.Min(request.Take, 50);
            var fromDate = request.FromDate;
            var toDate = request.ToDate;
            var codOnly = request.CodOnly == true;
            var excludeCod = request.ExcludeCod == true && !codOnly;
            var typeFilterValue = typeFilter;

            var totalCount = await _transactionRepository.GetCountAsync(
                predicate: t =>
                    walletIds.Contains(t.WalletId)
                    && (!fromDate.HasValue || t.CreatedAt >= fromDate.Value)
                    && (!toDate.HasValue || t.CreatedAt <= toDate.Value)
                    && (!typeFilterValue.HasValue || t.Type == typeFilterValue.Value)
                    && (!codOnly || t.Type == FinancialTransactionType.CodCollection || t.Type == FinancialTransactionType.CodRemittance)
                    && (!excludeCod || (t.Type != FinancialTransactionType.CodCollection && t.Type != FinancialTransactionType.CodRemittance)));

            // Chart series for selected range (daily net)
            var chartSource = await _transactionRepository.GetAsync(
                predicate: t =>
                    walletIds.Contains(t.WalletId)
                    && (!fromDate.HasValue || t.CreatedAt >= fromDate.Value)
                    && (!toDate.HasValue || t.CreatedAt <= toDate.Value)
                    && (!typeFilterValue.HasValue || t.Type == typeFilterValue.Value)
                    && (!codOnly || t.Type == FinancialTransactionType.CodCollection || t.Type == FinancialTransactionType.CodRemittance)
                    && (!excludeCod || (t.Type != FinancialTransactionType.CodCollection && t.Type != FinancialTransactionType.CodRemittance)),
                orderBy: q => q.OrderBy(t => t.CreatedAt),
                skip: 0,
                take: Math.Min(Math.Max(totalCount, 1), 5000),
                disableTracking: true);

            var dailyChart = chartSource
                .GroupBy(t => t.CreatedAt.Date)
                .Select(g => new
                {
                    date = g.Key.ToString("yyyy-MM-dd"),
                    income = g.Where(x => x.Amount > 0).Sum(x => x.Amount),
                    expense = g.Where(x => x.Amount < 0).Sum(x => Math.Abs(x.Amount)),
                    net = g.Sum(x => x.Amount)
                })
                .OrderBy(x => x.date)
                .ToList();

            var page = await _transactionRepository.GetAsync(
                predicate: t =>
                    walletIds.Contains(t.WalletId)
                    && (!fromDate.HasValue || t.CreatedAt >= fromDate.Value)
                    && (!toDate.HasValue || t.CreatedAt <= toDate.Value)
                    && (!typeFilterValue.HasValue || t.Type == typeFilterValue.Value)
                    && (!codOnly || t.Type == FinancialTransactionType.CodCollection || t.Type == FinancialTransactionType.CodRemittance)
                    && (!excludeCod || (t.Type != FinancialTransactionType.CodCollection && t.Type != FinancialTransactionType.CodRemittance)),
                orderBy: q => q.OrderByDescending(t => t.CreatedAt),
                skip: skip,
                take: take,
                disableTracking: true);

            var items = page.Select(t => new
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

            return ApiResponse.Success(new
            {
                items,
                totalCount,
                skip,
                take,
                dailyChart
            }, "Transactions retrieved.");
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
        private readonly IRestaurantProfileRepository _restaurantRepository;
        private readonly IShipperProfileRepository _shipperRepository;
        private readonly IPaymentSettlementService _paymentService;

        public GetWithdrawalsHandler(
            IWithdrawalRequestRepository withdrawalRepository, 
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantRepository,
            IShipperProfileRepository shipperRepository,
            IPaymentSettlementService paymentService)
        {
            _withdrawalRepository = withdrawalRepository;
            _userRepository = userRepository;
            _restaurantRepository = restaurantRepository;
            _shipperRepository = shipperRepository;
            _paymentService = paymentService;
        }

        public async Task<ApiResponse> Handle(GetWithdrawalsQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile));
            var user = users.FirstOrDefault();
            if (user?.Profile == null)
                return ApiResponse.Failure(403, "Forbidden.");

            bool isStaff = user.Profile.Role == UserRole.Admin || user.Profile.Role == UserRole.Coordinator;

            var walletIds = new List<Guid>();
            if (!isStaff)
            {
                if (user.Profile.Role == UserRole.Seller || user.Profile.Role == UserRole.Mall)
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
            }

            WithdrawalStatus? statusFilter = null;
            if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<WithdrawalStatus>(request.Status, out var parsedStatus))
                statusFilter = parsedStatus;

            var withdrawals = await _withdrawalRepository.GetAsync(
                predicate: w => (!statusFilter.HasValue || w.Status == statusFilter.Value) && (isStaff || walletIds.Contains(w.WalletId)),
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
                w.TransferProofImageUrl,
                w.RejectReason,
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

            const decimal vatRate = 0.08m;
            var config = await _paymentService.GetConfigAsync();
            var totalRevenue = orders.Sum(o => o.TotalAmount);
            var totalCommission = orders.Sum(o => o.PlatformCommission);
            var totalSellerPayout = orders.Sum(o => o.SellerPayout);
            var totalShipperIncome = orders.Sum(o => o.ShipperIncome);
            var totalShipping = orders.Sum(o => o.ShippingFee);
            var estimatedTax = Math.Round(totalCommission * vatRate, 0);
            var netPlatformRevenue = totalCommission - estimatedTax;
            var codOrders = orders.Count(o => o.PaymentMethod == PaymentMethod.COD);
            var prepaidOrders = orders.Count(o => o.PaymentMethod != PaymentMethod.COD);

            // Biểu đồ phân bổ theo ngày trong kỳ thanh toán/đối soát
            var fromDate = from.Date;
            var toDate = to.Date;
            var days = Math.Max(1, (toDate - fromDate).Days + 1);
            var groupedByDay = orders
                .GroupBy(o => o.UpdatedAt.Date)
                .ToDictionary(
                    g => g.Key,
                    g => new
                    {
                        gmv = g.Sum(o => o.TotalAmount),
                        platformRevenue = g.Sum(o => o.PlatformCommission),
                        sellerPayout = g.Sum(o => o.SellerPayout),
                        shipperIncome = g.Sum(o => o.ShipperIncome),
                        ordersCount = g.Count()
                    });

            var chartData = new List<object>();
            for (var d = fromDate; d <= toDate; d = d.AddDays(1))
            {
                groupedByDay.TryGetValue(d, out var day);
                chartData.Add(new
                {
                    date = d.ToString("MM/dd"),
                    gmv = day?.gmv ?? 0m,
                    platformRevenue = day?.platformRevenue ?? 0m,
                    sellerPayout = day?.sellerPayout ?? 0m,
                    shipperIncome = day?.shipperIncome ?? 0m,
                    ordersCount = day?.ordersCount ?? 0
                });
            }

            var transactions = await _transactionRepository.GetAllAsync();
            var recentTx = transactions.Where(t => t.CreatedAt >= from && t.CreatedAt <= to).ToList();

            return ApiResponse.Success(new
            {
                period = new { from, to, days },
                summary = new
                {
                    totalOrders = orders.Count,
                    totalRevenue,
                    totalCommission,
                    totalSellerPayout,
                    totalShipperIncome,
                    totalShipping,
                    estimatedTax,
                    netPlatformRevenue,
                    commissionRate = config.CommissionRate,
                    codOrders,
                    prepaidOrders
                },
                chartData,
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

    public class GetCodOverviewQuery : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
    }

    public class GetCodOverviewHandler : IRequestHandler<GetCodOverviewQuery, ApiResponse>
    {
        private readonly IShipperProfileRepository _shipperRepository;
        private readonly IUserRepository _userRepository;
        private readonly IFinancialTransactionRepository _transactionRepository;
        private readonly IWalletRepository _walletRepository;

        public GetCodOverviewHandler(
            IShipperProfileRepository shipperRepository,
            IUserRepository userRepository,
            IFinancialTransactionRepository transactionRepository,
            IWalletRepository walletRepository)
        {
            _shipperRepository = shipperRepository;
            _userRepository = userRepository;
            _transactionRepository = transactionRepository;
            _walletRepository = walletRepository;
        }

        public async Task<ApiResponse> Handle(GetCodOverviewQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile));
            if (users.FirstOrDefault()?.Profile?.Role != UserRole.Admin)
                return ApiResponse.Failure(403, "Forbidden.");

            var shippers = (await _shipperRepository.GetAsync(
                include: q => q.Include(s => s.UserProfile).ThenInclude(p => p.UserAccount),
                disableTracking: true)).ToList();

            var outstanding = shippers
                .Where(s => s.CodCollectedAmount > 0)
                .OrderByDescending(s => s.CodCollectedAmount)
                .Select(s => new
                {
                    shipperId = s.Id,
                    shipperName = s.UserProfile?.FullName ?? "Shipper",
                    phone = s.UserProfile?.UserAccount?.Phone,
                    codCollectedAmount = s.CodCollectedAmount,
                    debtLimit = s.DebtLimit,
                    usagePercent = s.DebtLimit > 0 ? Math.Round(s.CodCollectedAmount / s.DebtLimit * 100, 1) : 0
                })
                .ToList();

            var platformWallets = await _walletRepository.GetAsync(
                predicate: w => w.OwnerType == WalletOwnerType.Platform);
            var platformWalletIds = platformWallets.Select(w => w.Id).ToHashSet();

            var allTx = await _transactionRepository.GetAllAsync();
            var remittances = allTx
                .Where(t => t.Type == FinancialTransactionType.CodRemittance
                    && t.Amount > 0
                    && platformWalletIds.Contains(t.WalletId))
                .OrderByDescending(t => t.CreatedAt)
                .Take(50)
                .Select(t => new
                {
                    t.Id,
                    t.Amount,
                    t.Description,
                    shipperId = t.ReferenceId,
                    t.CreatedAt,
                    t.BalanceAfter
                })
                .ToList();

            return ApiResponse.Success(new
            {
                summary = new
                {
                    shippersWithDebt = outstanding.Count,
                    totalOutstandingCod = outstanding.Sum(x => x.codCollectedAmount),
                    totalRemitted = remittances.Sum(x => x.Amount)
                },
                outstandingDebts = outstanding,
                recentRemittances = remittances
            }, "COD overview.");
        }
    }

    public class GetSellerRevenuesQuery : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public Guid? RestaurantId { get; set; }
    }

    public class GetSellerRevenuesHandler : IRequestHandler<GetSellerRevenuesQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IRestaurantProfileRepository _restaurantRepository;
        private readonly IUserRepository _userRepository;
        private readonly IPaymentSettlementService _paymentService;

        public GetSellerRevenuesHandler(
            IOrderRepository orderRepository,
            IRestaurantProfileRepository restaurantRepository,
            IUserRepository userRepository,
            IPaymentSettlementService paymentService)
        {
            _orderRepository = orderRepository;
            _restaurantRepository = restaurantRepository;
            _userRepository = userRepository;
            _paymentService = paymentService;
        }

        public async Task<ApiResponse> Handle(GetSellerRevenuesQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile));
            if (users.FirstOrDefault()?.Profile?.Role != UserRole.Admin)
                return ApiResponse.Failure(403, "Forbidden.");

            var from = (request.FromDate ?? DateTime.UtcNow.AddDays(-30)).Date;
            var to = (request.ToDate ?? DateTime.UtcNow).Date;

            var orders = (await _orderRepository.GetAsync(
                predicate: o => o.Status == OrderStatus.Delivered
                    && o.CreatedAt.Date >= from && o.CreatedAt.Date <= to,
                include: q => q.Include(o => o.Items).ThenInclude(i => i.Product),
                disableTracking: true)).ToList();

            var restaurants = (await _restaurantRepository.GetAllAsync()).OrderBy(r => r.RestaurantName).ToList();
            var restaurantMap = restaurants.ToDictionary(r => r.Id);

            var tagged = orders
                .Select(o =>
                {
                    var restaurantId = o.Items.FirstOrDefault(i => i.Product != null)?.Product!.RestaurantId
                        ?? o.Items.FirstOrDefault()?.Product?.RestaurantId;
                    return new { Order = o, RestaurantId = restaurantId };
                })
                .Where(x => x.RestaurantId.HasValue)
                .Select(x => new { x.Order, RestaurantId = x.RestaurantId!.Value })
                .ToList();

            if (request.RestaurantId.HasValue)
                tagged = tagged.Where(x => x.RestaurantId == request.RestaurantId.Value).ToList();

            var bySeller = tagged
                .GroupBy(x => x.RestaurantId)
                .Select(g =>
                {
                    restaurantMap.TryGetValue(g.Key, out var rest);
                    var list = g.Select(x => x.Order).ToList();
                    return new
                    {
                        restaurantId = g.Key,
                        restaurantName = rest?.RestaurantName ?? "Unknown",
                        orderCount = list.Count,
                        codOrders = list.Count(o => o.PaymentMethod == PaymentMethod.COD),
                        prepaidOrders = list.Count(o => o.PaymentMethod != PaymentMethod.COD),
                        gmv = list.Sum(o => o.TotalAmount),
                        itemsSubtotal = list.Sum(o => o.ItemsSubtotal),
                        sellerPayout = list.Sum(o => o.SellerPayout),
                        platformCommission = list.Sum(o => o.PlatformCommission),
                        shipperIncome = list.Sum(o => o.ShipperIncome),
                        shipperBaseFee = list.Sum(o => o.ShipperBaseFeeAmount),
                        shipperDistanceFee = list.Sum(o => o.ShipperDistanceFeeAmount),
                        shipperPeakBonus = list.Sum(o => o.ShipperPeakBonus),
                        shippingFee = list.Sum(o => o.ShippingFee)
                    };
                })
                .OrderByDescending(x => x.gmv)
                .ToList();

            object? detail = null;
            if (request.RestaurantId.HasValue)
            {
                var detailOrders = tagged.Select(x => x.Order).ToList();
                var products = detailOrders
                    .SelectMany(o => o.Items.Where(i => !i.IsGift).Select(i => new { Order = o, Item = i }))
                    .GroupBy(x => new
                    {
                        Name = x.Item.ItemName,
                        ProductId = x.Item.ProductId
                    })
                    .Select(g => new
                    {
                        productId = g.Key.ProductId,
                        itemName = g.Key.Name,
                        quantitySold = g.Sum(x => x.Item.Quantity),
                        revenue = g.Sum(x => x.Item.TotalPrice),
                        orderCount = g.Select(x => x.Order.Id).Distinct().Count()
                    })
                    .OrderByDescending(x => x.revenue)
                    .ToList();

                detail = new
                {
                    restaurantId = request.RestaurantId.Value,
                    restaurantName = restaurantMap.TryGetValue(request.RestaurantId.Value, out var r)
                        ? r.RestaurantName
                        : "Unknown",
                    paymentSplit = new
                    {
                        codOrders = detailOrders.Count(o => o.PaymentMethod == PaymentMethod.COD),
                        prepaidOrders = detailOrders.Count(o => o.PaymentMethod != PaymentMethod.COD),
                        codGmv = detailOrders.Where(o => o.PaymentMethod == PaymentMethod.COD).Sum(o => o.TotalAmount),
                        prepaidGmv = detailOrders.Where(o => o.PaymentMethod != PaymentMethod.COD).Sum(o => o.TotalAmount)
                    },
                    products,
                    recentOrders = detailOrders
                        .OrderByDescending(o => o.CreatedAt)
                        .Take(30)
                        .Select(o => new
                        {
                            orderId = o.Id,
                            createdAt = o.CreatedAt,
                            paymentMethod = o.PaymentMethod.ToString(),
                            totalAmount = o.TotalAmount,
                            itemsSubtotal = o.ItemsSubtotal,
                            sellerPayout = o.SellerPayout,
                            platformCommission = o.PlatformCommission,
                            shipperIncome = o.ShipperIncome,
                            shippingFee = o.ShippingFee,
                            shipperBaseFee = o.ShipperBaseFeeAmount,
                            shipperDistanceFee = o.ShipperDistanceFeeAmount,
                            shipperPeakBonus = o.ShipperPeakBonus
                        })
                };
            }

            var config = await _paymentService.GetConfigAsync();

            return ApiResponse.Success(new
            {
                period = new { from, to },
                restaurants = restaurants.Select(r => new { id = r.Id, name = r.RestaurantName }),
                incomeFormula = new
                {
                    note = "Phí khách trả (ShippingFee) và thu nhập shipper (ShipperIncome) là 2 số độc lập.",
                    customerShipping = "Khách: freeship nếu đơn ≥ ngưỡng hoặc khoảng cách ≤ bán kính miễn phí; ngoài bán kính tính theo km (capped).",
                    shipperIncome = "Shipper = ShipperBaseFee + max(0, km−5)×ShipperFeePerKm + bonus giờ cao điểm %. Trong bán kính freeship khách có thể trả 0đ nhưng shipper vẫn nhận base fee (sàn bù).",
                    shipperBaseFee = config.ShipperBaseFee,
                    shipperFeePerKm = config.ShipperFeePerKm,
                    freeDistanceKmForShipper = 5,
                    platformCommission = $"Chiết khấu sàn = (Tiền món sau giảm giá) × {config.CommissionRate:P0}",
                    sellerPayout = "Seller nhận = Tiền món sau giảm giá − Chiết khấu sàn (+ phí ship nếu tự giao)"
                },
                summary = new
                {
                    sellerCount = bySeller.Count,
                    totalOrders = bySeller.Sum(x => x.orderCount),
                    totalCodOrders = bySeller.Sum(x => x.codOrders),
                    totalPrepaidOrders = bySeller.Sum(x => x.prepaidOrders),
                    totalGmv = bySeller.Sum(x => x.gmv),
                    totalSellerPayout = bySeller.Sum(x => x.sellerPayout),
                    totalPlatformCommission = bySeller.Sum(x => x.platformCommission),
                    totalShipperIncome = bySeller.Sum(x => x.shipperIncome),
                    totalShippingFee = bySeller.Sum(x => x.shippingFee)
                },
                sellers = bySeller,
                detail
            }, "Seller revenue report.");
        }
    }

    public class GetShipperRevenuesQuery : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public Guid? ShipperId { get; set; }
    }

    public class GetShipperRevenuesHandler : IRequestHandler<GetShipperRevenuesQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IShipperProfileRepository _shipperRepository;
        private readonly IUserRepository _userRepository;
        private readonly IPaymentSettlementService _paymentService;

        public GetShipperRevenuesHandler(
            IOrderRepository orderRepository,
            IShipperProfileRepository shipperRepository,
            IUserRepository userRepository,
            IPaymentSettlementService paymentService)
        {
            _orderRepository = orderRepository;
            _shipperRepository = shipperRepository;
            _userRepository = userRepository;
            _paymentService = paymentService;
        }

        public async Task<ApiResponse> Handle(GetShipperRevenuesQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile));
            if (users.FirstOrDefault()?.Profile?.Role != UserRole.Admin)
                return ApiResponse.Failure(403, "Forbidden.");

            var from = (request.FromDate ?? DateTime.UtcNow.AddDays(-30)).Date;
            var to = (request.ToDate ?? DateTime.UtcNow).Date;

            var orders = (await _orderRepository.GetAsync(
                predicate: o => o.Status == OrderStatus.Delivered
                    && o.ShipperId.HasValue
                    && o.CreatedAt.Date >= from && o.CreatedAt.Date <= to
                    && (!request.ShipperId.HasValue || o.ShipperId == request.ShipperId.Value),
                include: q => q.Include(o => o.Items).ThenInclude(i => i.Product)
                               .ThenInclude(p => p.Restaurant)
                               .Include(o => o.Shipper).ThenInclude(s => s.UserProfile)
                                   .ThenInclude(p => p.UserAccount),
                disableTracking: true)).ToList();

            var shippers = (await _shipperRepository.GetAsync(
                predicate: s => true,
                include: q => q.Include(s => s.UserProfile).ThenInclude(p => p.UserAccount),
                disableTracking: true))
                .OrderBy(s => s.UserProfile?.FullName)
                .ToList();

            var shipperMap = shippers.ToDictionary(s => s.Id);

            var byShipper = orders
                .GroupBy(o => o.ShipperId!.Value)
                .Select(g =>
                {
                    shipperMap.TryGetValue(g.Key, out var sp);
                    var list = g.ToList();
                    var name = sp?.UserProfile?.FullName
                        ?? list.FirstOrDefault()?.Shipper?.UserProfile?.FullName
                        ?? "Unknown";
                    var phone = sp?.UserProfile?.UserAccount?.Phone
                        ?? list.FirstOrDefault()?.Shipper?.UserProfile?.UserAccount?.Phone;
                    return new
                    {
                        shipperId = g.Key,
                        shipperName = name,
                        shipperPhone = phone,
                        orderCount = list.Count,
                        codOrders = list.Count(o => o.PaymentMethod == PaymentMethod.COD),
                        prepaidOrders = list.Count(o => o.PaymentMethod != PaymentMethod.COD),
                        totalIncome = list.Sum(o => o.ShipperIncome),
                        baseFee = list.Sum(o => o.ShipperBaseFeeAmount),
                        distanceFee = list.Sum(o => o.ShipperDistanceFeeAmount),
                        peakBonus = list.Sum(o => o.ShipperPeakBonus),
                        customerShippingFee = list.Sum(o => o.ShippingFee),
                        gmv = list.Sum(o => o.TotalAmount),
                        avgIncomePerOrder = list.Count > 0
                            ? Math.Round(list.Sum(o => o.ShipperIncome) / list.Count, 0)
                            : 0m
                    };
                })
                .OrderByDescending(x => x.totalIncome)
                .ToList();

            object? detail = null;
            if (request.ShipperId.HasValue)
            {
                var detailOrders = orders.ToList();
                var byRestaurant = detailOrders
                    .Select(o => new
                    {
                        Order = o,
                        RestaurantName = o.Items.FirstOrDefault()?.Product?.Restaurant?.RestaurantName ?? "N/A"
                    })
                    .GroupBy(x => x.RestaurantName)
                    .Select(g => new
                    {
                        restaurantName = g.Key,
                        orderCount = g.Count(),
                        income = g.Sum(x => x.Order.ShipperIncome)
                    })
                    .OrderByDescending(x => x.income)
                    .ToList();

                var row = byShipper.FirstOrDefault();
                detail = new
                {
                    shipperId = request.ShipperId.Value,
                    shipperName = row?.shipperName ?? "Unknown",
                    shipperPhone = row?.shipperPhone,
                    paymentSplit = new
                    {
                        codOrders = detailOrders.Count(o => o.PaymentMethod == PaymentMethod.COD),
                        prepaidOrders = detailOrders.Count(o => o.PaymentMethod != PaymentMethod.COD),
                        codIncome = detailOrders.Where(o => o.PaymentMethod == PaymentMethod.COD).Sum(o => o.ShipperIncome),
                        prepaidIncome = detailOrders.Where(o => o.PaymentMethod != PaymentMethod.COD).Sum(o => o.ShipperIncome)
                    },
                    byRestaurant,
                    recentOrders = detailOrders
                        .OrderByDescending(o => o.CreatedAt)
                        .Take(40)
                        .Select(o => new
                        {
                            orderId = o.Id,
                            createdAt = o.CreatedAt,
                            restaurantName = o.Items.FirstOrDefault()?.Product?.Restaurant?.RestaurantName ?? "N/A",
                            paymentMethod = o.PaymentMethod.ToString(),
                            totalAmount = o.TotalAmount,
                            shippingFee = o.ShippingFee,
                            shipperIncome = o.ShipperIncome,
                            shipperBaseFee = o.ShipperBaseFeeAmount,
                            shipperDistanceFee = o.ShipperDistanceFeeAmount,
                            shipperPeakBonus = o.ShipperPeakBonus,
                            deliveryAddress = o.DeliveryAddress,
                            contactName = o.ContactName
                        })
                };
            }

            var config = await _paymentService.GetConfigAsync();

            return ApiResponse.Success(new
            {
                period = new { from, to },
                shippers = shippers.Select(s => new
                {
                    id = s.Id,
                    name = s.UserProfile?.FullName ?? "Shipper",
                    phone = s.UserProfile?.UserAccount?.Phone
                }),
                incomeFormula = new
                {
                    note = "Thu nhập shipper (ShipperIncome) độc lập với phí ship khách trả (ShippingFee).",
                    shipperIncome = "Shipper = ShipperBaseFee + max(0, km−5)×ShipperFeePerKm + bonus giờ cao điểm %.",
                    shipperBaseFee = config.ShipperBaseFee,
                    shipperFeePerKm = config.ShipperFeePerKm,
                    freeDistanceKmForShipper = 5
                },
                summary = new
                {
                    shipperCount = byShipper.Count,
                    totalOrders = byShipper.Sum(x => x.orderCount),
                    totalCodOrders = byShipper.Sum(x => x.codOrders),
                    totalPrepaidOrders = byShipper.Sum(x => x.prepaidOrders),
                    totalIncome = byShipper.Sum(x => x.totalIncome),
                    totalBaseFee = byShipper.Sum(x => x.baseFee),
                    totalDistanceFee = byShipper.Sum(x => x.distanceFee),
                    totalPeakBonus = byShipper.Sum(x => x.peakBonus),
                    totalCustomerShippingFee = byShipper.Sum(x => x.customerShippingFee)
                },
                shipperRevenues = byShipper,
                detail
            }, "Shipper revenue report.");
        }
    }
}
