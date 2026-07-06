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
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
