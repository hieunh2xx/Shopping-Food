using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Domain.Models
{
    public class FinancialTransaction
    {
        public Guid Id { get; set; }
        public Guid WalletId { get; set; }
        public FinancialTransactionType Type { get; set; }
        public decimal Amount { get; set; }
        public decimal BalanceAfter { get; set; }
        public Guid? ReferenceId { get; set; }
        public string? ReferenceType { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual Wallet Wallet { get; set; } = null!;
    }
}
