using System;
using System.Collections.Generic;

namespace ShoppingFood.Dto.Product
{
    public class ProductDto
    {
        public Guid Id { get; set; }
        public Guid RestaurantId { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string Category { get; set; } = string.Empty;
        public string StockStatus { get; set; } = string.Empty;
        public string? PrimaryImageUrl { get; set; }
        public List<string> Images { get; set; } = new List<string>();
        public DateTime CreatedAt { get; set; }
        public bool IsHidden { get; set; }
    }
}
