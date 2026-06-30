using System;

namespace ShoppingFood.Dto.Order
{
    public class RecentOrderItemDto
    {
        public Guid ProductId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public string? ImageUrl { get; set; }
        public Guid? RestaurantId { get; set; }
        public string? RestaurantName { get; set; }
        public DateTime LastOrderedAt { get; set; }
    }
}
