using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Domain.Models
{
    public class WithdrawalRequest
    {
        public Guid Id { get; set; }
        public Guid WalletId { get; set; }
        public decimal Amount { get; set; }
        public string BankName { get; set; } = string.Empty;
        public string BankAccountNumber { get; set; } = string.Empty;
        public string BankAccountHolder { get; set; } = string.Empty;
        public WithdrawalStatus Status { get; set; } = WithdrawalStatus.Pending;
        public Guid? ApprovedByUserId { get; set; }
        public string? RejectReason { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual Wallet Wallet { get; set; } = null!;
    }
}
