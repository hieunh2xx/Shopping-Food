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
        public Guid CategoryId { get; set; }
        public StockStatus StockStatus { get; set; } = StockStatus.InStock;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsHidden { get; set; } = false;
        public bool IsFreeship { get; set; } = false;
        public TimeSpan? AvailableFrom { get; set; }
        public TimeSpan? AvailableTo { get; set; }
        public ProductStatus Status { get; set; } = ProductStatus.Pending;
        public Guid? GlobalCategoryId { get; set; }
        public bool IsDeleted { get; set; } = false;
        // Navigation properties
        public virtual RestaurantProfile Restaurant { get; set; } = null!;
        public virtual MenuCategory Category { get; set; } = null!;
        public virtual ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
        public virtual ICollection<ProductTopping> ProductToppings { get; set; } = new List<ProductTopping>();
        public virtual ICollection<ProductSize> ProductSizes { get; set; } = new List<ProductSize>();
        public virtual ICollection<ProductReview> Reviews { get; set; } = new List<ProductReview>();
        public virtual GlobalMenuCategory? GlobalCategory { get; set; }
        
    }
}
