using System;
namespace ShoppingFood.Dto.LoyaltyPoint
{
    public class LoyaltyPointHistoryDto
    {
        public Guid Id { get; set; }
        public Guid UserAccountId { get; set; }
        public int Points { get; set; }
        public string TransactionType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}