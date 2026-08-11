using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;

namespace ShoppingFood.Application.Services
{
    public class PaymentSettlementService : IPaymentSettlementService
    {
        private readonly IPlatformFinanceConfigRepository _configRepository;
        private readonly IWalletRepository _walletRepository;
        private readonly IFinancialTransactionRepository _transactionRepository;
        private readonly IPaymentSessionRepository _paymentSessionRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ISepayService _sepayService;
        private readonly IPaymentCacheService _paymentCache;
        private readonly ISepayBankAccountResolver _bankAccountResolver;
        private readonly INotificationRepository _notificationRepository;

        public PaymentSettlementService(
            IPlatformFinanceConfigRepository configRepository,
            IWalletRepository walletRepository,
            IFinancialTransactionRepository transactionRepository,
            IPaymentSessionRepository paymentSessionRepository,
            IOrderRepository orderRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            IShipperProfileRepository shipperProfileRepository,
            IUnitOfWork unitOfWork,
            ISepayService sepayService,
            IPaymentCacheService paymentCache,
            ISepayBankAccountResolver bankAccountResolver,
            INotificationRepository notificationRepository)
        {
            _configRepository = configRepository;
            _walletRepository = walletRepository;
            _transactionRepository = transactionRepository;
            _paymentSessionRepository = paymentSessionRepository;
            _orderRepository = orderRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _unitOfWork = unitOfWork;
            _sepayService = sepayService;
            _paymentCache = paymentCache;
            _bankAccountResolver = bankAccountResolver;
            _notificationRepository = notificationRepository;
        }

        public async Task<PlatformFinanceConfig> GetConfigAsync()
        {
            var configs = await _configRepository.GetAllAsync();
            var config = configs.FirstOrDefault();
            if (config == null)
            {
                config = new PlatformFinanceConfig { Id = Guid.NewGuid() };
                _configRepository.Add(config);
                await _unitOfWork.SaveChangesAsync();
            }
            return config;
        }

        public (decimal ItemsSubtotal, decimal PlatformCommission, decimal SellerPayout, decimal ShipperEarning) CalculateSplit(
            decimal totalAmount, decimal shippingFee, decimal shipperIncome, decimal commissionRate, bool isSelfDelivery = false)
        {
            var itemsSubtotal = Math.Max(0, totalAmount - shippingFee);
            var platformCommission = Math.Round(itemsSubtotal * commissionRate, 0);
            var sellerPayout = itemsSubtotal - platformCommission;
            if (isSelfDelivery)
            {
                sellerPayout += shippingFee;
            }
            var shipperEarning = shipperIncome;
            return (itemsSubtotal, platformCommission, sellerPayout, shipperEarning);
        }

        public async Task<Wallet> GetOrCreateWalletAsync(WalletOwnerType ownerType, Guid ownerId)
        {
            var wallets = await _walletRepository.GetAsync(
                predicate: w => w.OwnerType == ownerType && w.OwnerId == ownerId,
                disableTracking: false);
            var wallet = wallets.FirstOrDefault();
            if (wallet != null) return wallet;

            wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                OwnerType = ownerType,
                OwnerId = ownerId,
                Balance = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _walletRepository.Add(wallet);
            return wallet;
        }

        public async Task RecordTransactionAsync(Wallet wallet, FinancialTransactionType type, decimal amount, string description, Guid? referenceId = null, string? referenceType = null)
        {
            wallet.Balance += amount;
            wallet.UpdatedAt = DateTime.UtcNow;
            _walletRepository.Update(wallet);

            _transactionRepository.Add(new FinancialTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                Type = type,
                Amount = amount,
                BalanceAfter = wallet.Balance,
                ReferenceId = referenceId,
                ReferenceType = referenceType,
                Description = description,
                CreatedAt = DateTime.UtcNow
            });
        }

        public async Task<string?> ProcessCheckoutPaymentAsync(Order order, Guid? userId, string? cardLastFour = null, string? cardBrand = null, EWalletProvider? provider = null)
        {
            var config = await GetConfigAsync();
            var split = CalculateSplit(order.TotalAmount, order.ShippingFee, order.ShipperIncome, config.CommissionRate);
            order.ItemsSubtotal = split.ItemsSubtotal;
            order.PlatformCommission = split.PlatformCommission;
            order.SellerPayout = split.SellerPayout;

            switch (order.PaymentMethod)
            {
                case PaymentMethod.COD:
                    order.PaymentStatus = PaymentStatus.Pending;
                    return null;

                case PaymentMethod.SystemWallet:
                    if (!userId.HasValue)
                        return "Ví hệ thống chỉ dành cho khách hàng đã đăng nhập.";
                    var customerWallet = await GetOrCreateWalletAsync(WalletOwnerType.Customer, userId.Value);
                    if (customerWallet.Balance < order.TotalAmount)
                        return "Số dư ví không đủ. Vui lòng nạp thêm tiền.";
                    await RecordTransactionAsync(customerWallet, FinancialTransactionType.Payment, -order.TotalAmount,
                        $"Thanh toán đơn hàng #{order.Id}", order.Id, "Order");
                    order.PaymentStatus = PaymentStatus.Paid;
                    return null;

                case PaymentMethod.CreditCard:
                case PaymentMethod.EWallet:
                    if (!userId.HasValue)
                        return "Phương thức thanh toán trả trước yêu cầu đăng nhập.";
                    var session = new PaymentSession
                    {
                        Id = Guid.NewGuid(),
                        OrderId = order.Id,
                        UserAccountId = userId,
                        PaymentMethod = order.PaymentMethod,
                        EWalletProvider = provider,
                        Amount = order.TotalAmount,
                        Status = PaymentSessionStatus.Pending,
                        CardLastFour = cardLastFour,
                        CardBrand = cardBrand,
                        ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _paymentSessionRepository.Add(session);
                    order.PaymentSessionId = session.Id;
                    order.PaymentStatus = PaymentStatus.Pending;
                    return null;

                case PaymentMethod.Sepay:
                    if (!_sepayService.IsEnabled)
                        return "Cổng thanh toán SePay chưa được cấu hình.";
                    if (!userId.HasValue)
                        return "Thanh toán online SePay yêu cầu đăng nhập.";
                    var bank = await _bankAccountResolver.ResolveAsync();
                    if (bank == null)
                        return "Chưa cấu hình tài khoản ngân hàng SePay để tạo mã QR. Liên hệ quản trị viên.";
                    var sepaySessionId = Guid.NewGuid();
                    var invoiceNumber = _sepayService.GenerateInvoiceNumber(sepaySessionId);
                    var qrUrl = _sepayService.BuildQrImageUrl(invoiceNumber, order.TotalAmount, bank);
                    var sepaySession = new PaymentSession
                    {
                        Id = sepaySessionId,
                        OrderId = order.Id,
                        UserAccountId = userId,
                        PaymentMethod = PaymentMethod.Sepay,
                        Amount = order.TotalAmount,
                        Status = PaymentSessionStatus.Pending,
                        InvoiceNumber = invoiceNumber,
                        ExpiresAt = DateTime.UtcNow.AddMinutes(10),
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _paymentSessionRepository.Add(sepaySession);
                    order.PaymentSessionId = sepaySession.Id;
                    order.PaymentStatus = PaymentStatus.Pending;

                    _paymentCache.Set(new Application.Models.PaymentCacheEntry
                    {
                        PaymentId = sepaySession.Id,
                        InvoiceNumber = invoiceNumber,
                        Amount = order.TotalAmount,
                        OrderId = order.Id,
                        UserId = userId,
                        Status = "Pending",
                        CreatedAt = sepaySession.CreatedAt,
                        ExpiresAt = sepaySession.ExpiresAt,
                        QrImageUrl = qrUrl
                    });
                    return null;

                default:
                    return "Phương thức thanh toán không hợp lệ.";
            }
        }

        public async Task<PaymentSession?> CreateTopUpSessionAsync(Guid userId, decimal amount)
        {
            if (!_sepayService.IsEnabled)
                return null;

            var bank = await _bankAccountResolver.ResolveAsync();
            if (bank == null)
                return null;

            var sepaySessionId = Guid.NewGuid();
            var invoiceNumber = _sepayService.GenerateInvoiceNumber(sepaySessionId);
            var qrUrl = _sepayService.BuildQrImageUrl(invoiceNumber, amount, bank);

            var sepaySession = new PaymentSession
            {
                Id = sepaySessionId,
                OrderId = null,
                UserAccountId = userId,
                PaymentMethod = PaymentMethod.Sepay,
                Amount = amount,
                Status = PaymentSessionStatus.Pending,
                InvoiceNumber = invoiceNumber,
                ExpiresAt = DateTime.UtcNow.AddMinutes(10),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            // Note: PaymentSession in DB does not have QrImageUrl. But we don't need to store it in DB, we cache it.
            _paymentSessionRepository.Add(sepaySession);

            _paymentCache.Set(new Application.Models.PaymentCacheEntry
            {
                PaymentId = sepaySession.Id,
                InvoiceNumber = invoiceNumber,
                Amount = amount,
                OrderId = null,
                UserId = userId,
                Status = "Pending",
                CreatedAt = sepaySession.CreatedAt,
                ExpiresAt = sepaySession.ExpiresAt,
                QrImageUrl = qrUrl
            });

            return sepaySession;
        }

        public async Task ConfirmPaymentSessionAsync(Guid sessionId)
        {
            var sessions = await _paymentSessionRepository.GetAsync(
                predicate: s => s.Id == sessionId,
                disableTracking: false);
            var session = sessions.FirstOrDefault();
            if (session == null || session.Status != PaymentSessionStatus.Pending)
                return;

            session.Status = PaymentSessionStatus.Completed;
            session.UpdatedAt = DateTime.UtcNow;
            _paymentSessionRepository.Update(session);

            if (session.OrderId.HasValue)
            {
                var orders = await _orderRepository.GetAsync(
                    predicate: o => o.Id == session.OrderId.Value,
                    disableTracking: false);
                var order = orders.FirstOrDefault();
                if (order != null)
                {
                    order.PaymentStatus = PaymentStatus.Paid;
                    order.UpdatedAt = DateTime.UtcNow;
                    _orderRepository.Update(order);
                }
            }
        }

        public async Task<bool> ConfirmPaymentSessionByInvoiceAsync(
            string invoiceNumber,
            decimal? paidAmount = null,
            string? externalTransactionId = null,
            bool allowExpired = false)
        {
            var resolvedInvoice = _sepayService.ResolveInvoiceFromTransferCode(invoiceNumber) ?? invoiceNumber.Trim();

            var sessions = await _paymentSessionRepository.GetAsync(
                predicate: s => s.InvoiceNumber == resolvedInvoice,
                disableTracking: false);
            var session = sessions.FirstOrDefault();
            if (session == null)
                return false;

            if (session.Status == PaymentSessionStatus.Completed)
                return true;

            if (allowExpired)
            {
                // Cho phép xác nhận muộn sau khi session Expired (khách đã CK nhưng đóng QR / hết hạn UI)
                if (session.Status == PaymentSessionStatus.Failed)
                    return false;
                if (session.Status != PaymentSessionStatus.Pending
                    && session.Status != PaymentSessionStatus.Expired
                    && session.Status != PaymentSessionStatus.Completed)
                    return false;
            }
            else
            {
                if (session.Status != PaymentSessionStatus.Pending)
                    return false;

                if (session.ExpiresAt < DateTime.UtcNow)
                {
                    session.Status = PaymentSessionStatus.Expired;
                    session.UpdatedAt = DateTime.UtcNow;
                    _paymentSessionRepository.Update(session);
                    return false;
                }
            }

            if (paidAmount.HasValue && Math.Abs(paidAmount.Value - session.Amount) > 1)
                return false;

            session.Status = PaymentSessionStatus.Completed;
            session.UpdatedAt = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(externalTransactionId))
                session.ExternalTransactionId = externalTransactionId;
            _paymentSessionRepository.Update(session);

            if (session.OrderId.HasValue)
            {
                var orders = await _orderRepository.GetAsync(
                    predicate: o => o.Id == session.OrderId.Value,
                    include: q => q.Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p!.Restaurant).ThenInclude(r => r.Owner),
                    disableTracking: false);
                var order = orders.FirstOrDefault();
                if (order != null)
                {
                    order.PaymentStatus = PaymentStatus.Paid;
                    order.UpdatedAt = DateTime.UtcNow;

                    // Tiền về muộn sau khi khách đóng QR / hết hạn → khôi phục đơn chờ nhà hàng nhận
                    var abandonedOrExpired =
                        order.Status == OrderStatus.Cancelled
                        && order.PaymentMethod == PaymentMethod.Sepay
                        && order.RejectReason != null
                        && (order.RejectReason.StartsWith("[Payment Abandoned]", StringComparison.Ordinal)
                            || order.RejectReason.StartsWith("[Payment Expired]", StringComparison.Ordinal));

                    if (abandonedOrExpired)
                    {
                        order.Status = OrderStatus.Pending;
                        order.RejectReason = null;
                    }

                    _orderRepository.Update(order);

                    var restaurant = order.Items.FirstOrDefault()?.Product?.Restaurant;
                    if (restaurant != null && order.Status == OrderStatus.Pending)
                    {
                        var notification = new Notification
                        {
                            Id = Guid.NewGuid(),
                            UserId = restaurant.Owner.UserAccountId,
                            Title = "Đơn hàng mới",
                            Message = $"Bạn có đơn hàng mới #{order.Id.ToString().Substring(0, 8)} (Đã thanh toán Online).",
                            NotificationType = NotificationType.System,
                            TargetId = order.Id,
                            IsRead = false,
                            CreateAt = DateTime.UtcNow
                        };
                        _notificationRepository.Add(notification);
                    }
                }
            }
            else if (session.UserAccountId.HasValue)
            {
                // This is a Wallet Top-up session because OrderId is null
                var wallet = await GetOrCreateWalletAsync(WalletOwnerType.Customer, session.UserAccountId.Value);
                await RecordTransactionAsync(wallet, FinancialTransactionType.TopUp, session.Amount,
                    $"Nạp tiền từ thanh toán SePay - Mã {resolvedInvoice}");
            }

            return true;
        }

        public async Task SettleOrderOnDeliveryAsync(Order order, ShipperProfile shipper)
        {
            if (order.IsFinancialSettled) return;

            var config = await GetConfigAsync();
            var split = CalculateSplit(order.TotalAmount, order.ShippingFee, order.ShipperIncome, config.CommissionRate);
            order.ItemsSubtotal = split.ItemsSubtotal;
            order.PlatformCommission = split.PlatformCommission;
            order.SellerPayout = split.SellerPayout;

            var restaurantId = await GetOrderRestaurantIdAsync(order);
            var shipperWallet = await GetOrCreateWalletAsync(WalletOwnerType.Shipper, shipper.Id);
            var platformWallet = await GetOrCreateWalletAsync(WalletOwnerType.Platform, Guid.Empty);
            var shipperWasPaid = false;

            if (order.PaymentMethod == PaymentMethod.COD)
            {
                var amountToRemit = split.SellerPayout + split.PlatformCommission;
                shipper.CodCollectedAmount += amountToRemit;
                shipper.WalletBalance += split.ShipperEarning;

                await RecordTransactionAsync(shipperWallet, FinancialTransactionType.ShipperEarning, split.ShipperEarning,
                    $"Thu nhập giao hàng đơn #{order.Id} (COD)", order.Id, "Order");
                await RecordTransactionAsync(shipperWallet, FinancialTransactionType.CodCollection, amountToRemit,
                    $"Thu hộ tiền hàng đơn #{order.Id} - cần nộp sàn", order.Id, "Order");

                if (restaurantId.HasValue)
                {
                    var sellerWallet = await GetOrCreateWalletAsync(WalletOwnerType.Seller, restaurantId.Value);
                    await RecordTransactionAsync(sellerWallet, FinancialTransactionType.SellerPayout, split.SellerPayout,
                        $"Doanh thu đơn #{order.Id} (COD - chờ đối soát)", order.Id, "Order");
                }

                await RecordTransactionAsync(platformWallet, FinancialTransactionType.Commission, split.PlatformCommission,
                    $"Chiết khấu sàn đơn #{order.Id} (COD)", order.Id, "Order");

                order.PaymentStatus = PaymentStatus.Settled;
                shipperWasPaid = true;
            }
            else if (order.PaymentStatus == PaymentStatus.Paid)
            {
                if (restaurantId.HasValue)
                {
                    var sellerWallet = await GetOrCreateWalletAsync(WalletOwnerType.Seller, restaurantId.Value);
                    await RecordTransactionAsync(sellerWallet, FinancialTransactionType.SellerPayout, split.SellerPayout,
                        $"Doanh thu đơn #{order.Id}", order.Id, "Order");
                }
                await RecordTransactionAsync(shipperWallet, FinancialTransactionType.ShipperEarning, split.ShipperEarning,
                    $"Thu nhập giao hàng đơn #{order.Id}", order.Id, "Order");
                await RecordTransactionAsync(platformWallet, FinancialTransactionType.Commission, split.PlatformCommission,
                    $"Chiết khấu sàn đơn #{order.Id}", order.Id, "Order");

                shipper.WalletBalance += split.ShipperEarning;
                order.PaymentStatus = PaymentStatus.Settled;
                shipperWasPaid = true;
            }

            // Freeship / phí khách < thu nhập shipper: sàn bù phần thiếu từ ví nền tảng.
            if (shipperWasPaid)
            {
                await DebitPlatformShippingSubsidyAsync(
                    platformWallet, split.ShipperEarning, order.ShippingFee, order.Id);
            }

            order.IsFinancialSettled = true;
            order.UpdatedAt = DateTime.UtcNow;
            _orderRepository.Update(order);
            _shipperProfileRepository.Update(shipper);
        }

        /// <summary>
        /// Khi khách trả ShippingFee &lt; ShipperIncome (điển hình freeship = 0),
        /// phần còn lại khấu trừ vào ví nền tảng.
        /// </summary>
        private async Task DebitPlatformShippingSubsidyAsync(
            Wallet platformWallet, decimal shipperEarning, decimal shippingFee, Guid orderId)
        {
            var subsidy = Math.Max(0, Math.Round(shipperEarning - shippingFee, 0));
            if (subsidy <= 0) return;

            var description = shippingFee <= 0
                ? $"Hỗ trợ freeship đơn #{orderId} — trả shipper"
                : $"Bù phí ship đơn #{orderId} (shipper {shipperEarning:0} > phí khách {shippingFee:0})";

            await RecordTransactionAsync(
                platformWallet,
                FinancialTransactionType.ShippingSubsidy,
                -subsidy,
                description,
                orderId,
                "Order");
        }

        public async Task SettleSelfDeliveryOrderAsync(Order order)
        {
            if (order.IsFinancialSettled) return;

            var config = await GetConfigAsync();
            var split = CalculateSplit(order.TotalAmount, order.ShippingFee, order.ShipperIncome, config.CommissionRate, isSelfDelivery: true);
            order.ItemsSubtotal = split.ItemsSubtotal;
            order.PlatformCommission = split.PlatformCommission;
            order.SellerPayout = split.SellerPayout;

            var restaurantId = await GetOrderRestaurantIdAsync(order);
            if (restaurantId == null) return;

            var sellerWallet = await GetOrCreateWalletAsync(WalletOwnerType.Seller, restaurantId.Value);
            var platformWallet = await GetOrCreateWalletAsync(WalletOwnerType.Platform, Guid.Empty);

            if (order.PaymentMethod == PaymentMethod.COD)
            {
                // Nhà hàng tự giao và đã thu đủ tiền mặt (TotalAmount).
                // Nhà hàng được giữ SellerPayout (bao gồm tiền món + tiền ship), phải nộp lại PlatformCommission cho nền tảng.
                await RecordTransactionAsync(sellerWallet, FinancialTransactionType.SellerPayout, split.SellerPayout,
                    $"Doanh thu đơn #{order.Id} (COD tự giao - chờ đối soát)", order.Id, "Order");
                
                await RecordTransactionAsync(sellerWallet, FinancialTransactionType.Commission, -split.PlatformCommission,
                    $"Trừ chiết khấu sàn đơn #{order.Id} (COD tự giao)", order.Id, "Order");

                await RecordTransactionAsync(platformWallet, FinancialTransactionType.Commission, split.PlatformCommission,
                    $"Chiết khấu sàn đơn #{order.Id} (COD tự giao)", order.Id, "Order");

                order.PaymentStatus = PaymentStatus.Settled;
            }
            else if (order.PaymentStatus == PaymentStatus.Paid)
            {
                // Khách đã thanh toán online cho nền tảng (nền tảng đã thu đủ tiền).
                // Nền tảng trả cho nhà hàng SellerPayout (bao gồm tiền món + tiền ship).
                await RecordTransactionAsync(sellerWallet, FinancialTransactionType.SellerPayout, split.SellerPayout,
                    $"Doanh thu đơn #{order.Id} (Tự giao)", order.Id, "Order");
                
                await RecordTransactionAsync(platformWallet, FinancialTransactionType.Commission, split.PlatformCommission,
                    $"Chiết khấu sàn đơn #{order.Id} (Tự giao)", order.Id, "Order");

                order.PaymentStatus = PaymentStatus.Settled;
            }

            order.IsFinancialSettled = true;
            order.UpdatedAt = DateTime.UtcNow;
            _orderRepository.Update(order);
        }

        public async Task<string?> ProcessRefundAsync(Order order)
        {
            // COD không hoàn ví
            if (order.PaymentMethod == PaymentMethod.COD)
                return null;

            if (order.PaymentStatus == PaymentStatus.Refunded)
                return null;

            // SePay / SystemWallet / CreditCard / EWallet: chỉ hoàn khi đã Paid
            if (order.PaymentStatus != PaymentStatus.Paid)
                return null;

            if (!order.UserAccountId.HasValue)
                return null;

            var existingRefunds = await _transactionRepository.GetAsync(
                predicate: t =>
                    t.ReferenceId == order.Id
                    && t.ReferenceType == "Order"
                    && t.Type == FinancialTransactionType.Refund,
                disableTracking: true);
            if (existingRefunds.Any())
            {
                order.PaymentStatus = PaymentStatus.Refunded;
                order.UpdatedAt = DateTime.UtcNow;
                _orderRepository.Update(order);
                return null;
            }

            var refundAmount = order.TotalAmount;
            if (refundAmount <= 0)
                return null;

            // Hoàn về đúng ví khách (cùng OwnerId dùng khi trừ ví lúc checkout)
            var customerWallet = await GetOrCreateWalletAsync(WalletOwnerType.Customer, order.UserAccountId.Value);
            var refundLabel = order.PaymentMethod == PaymentMethod.SystemWallet
                ? $"Hoàn tiền ví — đơn hàng #{order.Id}"
                : $"Hoàn tiền đơn hàng #{order.Id}";

            await RecordTransactionAsync(
                customerWallet,
                FinancialTransactionType.Refund,
                refundAmount,
                refundLabel,
                order.Id,
                "Order");

            order.PaymentStatus = PaymentStatus.Refunded;
            order.UpdatedAt = DateTime.UtcNow;
            _orderRepository.Update(order);

            var shortId = order.Id.ToString()[..8].ToUpperInvariant();
            var amountText = refundAmount.ToString("N0");
            var message = order.PaymentMethod == PaymentMethod.SystemWallet
                ? $"Đơn #{shortId} đã hủy. {amountText}đ đã được hoàn lại vào ví tích lũy của bạn."
                : $"Đơn #{shortId} đã được hoàn {amountText}đ vào ví ShoppingFood của bạn.";

            _notificationRepository.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = order.UserAccountId.Value,
                Title = "Hoàn tiền vào ví",
                Message = message,
                NotificationType = NotificationType.Payment,
                TargetId = order.Id,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            });

            return null;
        }

        private async Task<Guid?> GetOrderRestaurantIdAsync(Order order)
        {
            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == order.Id,
                include: q => q.Include(o => o.Items).ThenInclude(i => i.Product),
                disableTracking: true);
            var fullOrder = orders.FirstOrDefault();
            return fullOrder?.Items.FirstOrDefault(i => i.Product != null)?.Product?.RestaurantId;
        }
    }
}
