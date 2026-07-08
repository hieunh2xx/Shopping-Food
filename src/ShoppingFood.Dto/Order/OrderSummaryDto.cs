using System;

namespace ShoppingFood.Dto.Order
{
    public class OrderSummaryDto
    {
        public Guid Id { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool CanCancel { get; set; }
        public bool CanMessageSeller { get; set; }
        public Guid? RestaurantId { get; set; }
        public string? RestaurantName { get; set; }
        public Guid? OrderChatSessionId { get; set; }
        public Guid? PaymentSessionId { get; set; }

    }
}
