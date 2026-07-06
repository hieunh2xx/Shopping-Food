using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Domain.Models
{
    public class PaymentSession
    {
        public Guid Id { get; set; }
        public Guid? OrderId { get; set; }
        public Guid? UserAccountId { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public EWalletProvider? EWalletProvider { get; set; }
        public decimal Amount { get; set; }
        public PaymentSessionStatus Status { get; set; } = PaymentSessionStatus.Pending;
        public string? CardLastFour { get; set; }
        public string? CardBrand { get; set; }
        /// <summary>SePay order_invoice_number — used for IPN and bank webhook matching.</summary>
        public string? InvoiceNumber { get; set; }
        public string? SepayOrderId { get; set; }
        public string? ExternalTransactionId { get; set; }
        public string? SepayPaymentMethod { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
