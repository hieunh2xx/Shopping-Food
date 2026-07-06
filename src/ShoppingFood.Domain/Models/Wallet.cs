using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Domain.Models
{
    public class Wallet
    {
        public Guid Id { get; set; }
        public WalletOwnerType OwnerType { get; set; }
        public Guid OwnerId { get; set; }
        public decimal Balance { get; set; } = 0;
        public string? BankName { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? BankAccountHolder { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
