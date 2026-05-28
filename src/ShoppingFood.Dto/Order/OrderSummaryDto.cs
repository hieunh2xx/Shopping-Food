using System;

namespace ShoppingFood.Dto.Order
{
    public class OrderSummaryDto
    {
        public Guid Id { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
