using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

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

        public PaymentSettlementService(
            IPlatformFinanceConfigRepository configRepository,
            IWalletRepository walletRepository,
            IFinancialTransactionRepository transactionRepository,
            IPaymentSessionRepository paymentSessionRepository,
            IOrderRepository orderRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            IShipperProfileRepository shipperProfileRepository,
            IUnitOfWork unitOfWork)
        {
            _configRepository = configRepository;
            _walletRepository = walletRepository;
            _transactionRepository = transactionRepository;
            _paymentSessionRepository = paymentSessionRepository;
            _orderRepository = orderRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _unitOfWork = unitOfWork;
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
            decimal totalAmount, decimal shippingFee, decimal commissionRate, decimal shipperBonus)
        {
            var itemsSubtotal = Math.Max(0, totalAmount - shippingFee);
            var platformCommission = Math.Round(itemsSubtotal * commissionRate, 0);
            var sellerPayout = itemsSubtotal - platformCommission;
            var shipperEarning = shippingFee + shipperBonus;
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
            var split = CalculateSplit(order.TotalAmount, order.ShippingFee, config.CommissionRate, config.ShipperDeliveryBonus);
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

                default:
                    return "Phương thức thanh toán không hợp lệ.";
            }
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

        public async Task SettleOrderOnDeliveryAsync(Order order, ShipperProfile shipper)
        {
            if (order.IsFinancialSettled) return;

            var config = await GetConfigAsync();
            var split = CalculateSplit(order.TotalAmount, order.ShippingFee, config.CommissionRate, config.ShipperDeliveryBonus);
            order.ItemsSubtotal = split.ItemsSubtotal;
            order.PlatformCommission = split.PlatformCommission;
            order.SellerPayout = split.SellerPayout;

            var restaurantId = await GetOrderRestaurantIdAsync(order);
            if (restaurantId == null) return;

            var sellerWallet = await GetOrCreateWalletAsync(WalletOwnerType.Seller, restaurantId.Value);
            var shipperWallet = await GetOrCreateWalletAsync(WalletOwnerType.Shipper, shipper.Id);
            var platformWallet = await GetOrCreateWalletAsync(WalletOwnerType.Platform, Guid.Empty);

            if (order.PaymentMethod == PaymentMethod.COD)
            {
                var amountToRemit = split.SellerPayout + split.PlatformCommission;
                shipper.CodCollectedAmount += amountToRemit;
                shipper.WalletBalance += split.ShipperEarning;

                await RecordTransactionAsync(shipperWallet, FinancialTransactionType.ShipperEarning, split.ShipperEarning,
                    $"Thu nhập giao hàng đơn #{order.Id} (COD)", order.Id, "Order");
                await RecordTransactionAsync(shipperWallet, FinancialTransactionType.CodCollection, amountToRemit,
                    $"Thu hộ tiền hàng đơn #{order.Id} - cần nộp sàn", order.Id, "Order");

                await RecordTransactionAsync(sellerWallet, FinancialTransactionType.SellerPayout, split.SellerPayout,
                    $"Doanh thu đơn #{order.Id} (COD - chờ đối soát)", order.Id, "Order");
                await RecordTransactionAsync(platformWallet, FinancialTransactionType.Commission, split.PlatformCommission,
                    $"Chiết khấu sàn đơn #{order.Id} (COD)", order.Id, "Order");

                order.PaymentStatus = PaymentStatus.Settled;
            }
            else if (order.PaymentStatus == PaymentStatus.Paid)
            {
                await RecordTransactionAsync(sellerWallet, FinancialTransactionType.SellerPayout, split.SellerPayout,
                    $"Doanh thu đơn #{order.Id}", order.Id, "Order");
                await RecordTransactionAsync(shipperWallet, FinancialTransactionType.ShipperEarning, split.ShipperEarning,
                    $"Thu nhập giao hàng đơn #{order.Id}", order.Id, "Order");
                await RecordTransactionAsync(platformWallet, FinancialTransactionType.Commission, split.PlatformCommission,
                    $"Chiết khấu sàn đơn #{order.Id}", order.Id, "Order");

                shipper.WalletBalance += split.ShipperEarning;
                order.PaymentStatus = PaymentStatus.Settled;
            }

            order.IsFinancialSettled = true;
            order.UpdatedAt = DateTime.UtcNow;
            _orderRepository.Update(order);
            _shipperProfileRepository.Update(shipper);
        }

        public async Task<string?> ProcessRefundAsync(Order order)
        {
            if (order.PaymentMethod == PaymentMethod.COD || order.PaymentStatus != PaymentStatus.Paid)
                return null;

            if (!order.UserAccountId.HasValue) return null;

            var customerWallet = await GetOrCreateWalletAsync(WalletOwnerType.Customer, order.UserAccountId.Value);
            await RecordTransactionAsync(customerWallet, FinancialTransactionType.Refund, order.TotalAmount,
                $"Hoàn tiền đơn hàng #{order.Id}", order.Id, "Order");
            order.PaymentStatus = PaymentStatus.Refunded;
            order.UpdatedAt = DateTime.UtcNow;
            _orderRepository.Update(order);
            return null;
        }

        private async Task<Guid?> GetOrderRestaurantIdAsync(Order order)
        {
            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == order.Id,
                include: q => q.Include(o => o.Items).ThenInclude(i => i.Product),
                disableTracking: true);
            var fullOrder = orders.FirstOrDefault();
            return fullOrder?.Items.FirstOrDefault()?.Product?.RestaurantId;
        }
    }
}
