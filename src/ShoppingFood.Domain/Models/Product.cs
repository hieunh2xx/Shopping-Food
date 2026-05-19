using System;
using System.Collections.Generic;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Domain.Models
{
    public class Product
    {
        public Guid Id { get; set; }
        public Guid RestaurantId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string Category { get; set; } = string.Empty;
        public StockStatus StockStatus { get; set; } = StockStatus.InStock;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual RestaurantProfile Restaurant { get; set; } = null!;
        public virtual ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    }
}
