using Microsoft.EntityFrameworkCore;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Interfaces
{
    public interface IPaymentSettlementService
    {
        Task<PlatformFinanceConfig> GetConfigAsync();
        (decimal ItemsSubtotal, decimal PlatformCommission, decimal SellerPayout, decimal ShipperEarning) CalculateSplit(
            decimal totalAmount, decimal shippingFee, decimal shipperIncome, decimal commissionRate, bool isSelfDelivery = false);
        Task<Wallet> GetOrCreateWalletAsync(WalletOwnerType ownerType, Guid ownerId);
        Task RecordTransactionAsync(Wallet wallet, FinancialTransactionType type, decimal amount, string description, Guid? referenceId = null, string? referenceType = null);
        Task<string?> ProcessCheckoutPaymentAsync(Order order, Guid? userId, string? cardLastFour = null, string? cardBrand = null, EWalletProvider? provider = null);
        Task SettleOrderOnDeliveryAsync(Order order, ShipperProfile shipper);
        Task SettleSelfDeliveryOrderAsync(Order order);
        Task<string?> ProcessRefundAsync(Order order);
        Task ConfirmPaymentSessionAsync(Guid sessionId);
        Task<bool> ConfirmPaymentSessionByInvoiceAsync(
            string invoiceNumber,
            decimal? paidAmount = null,
            string? externalTransactionId = null,
            bool allowExpired = false);
    }
}
