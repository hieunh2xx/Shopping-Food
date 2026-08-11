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
        public decimal? FlashSalePrice { get; set; }
        public Guid CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public Guid? GlobalCategoryId { get; set; }
        public string? GlobalCategoryName { get; set; }
        public string StockStatus { get; set; } = string.Empty;
        public string? PrimaryImageUrl { get; set; }
        public List<string> Images { get; set; } = new List<string>();
        public List<ProductToppingDto> Toppings { get; set; } = new List<ProductToppingDto>();
        public List<ProductSizeDto> Sizes { get; set; } = new List<ProductSizeDto>();
        public DateTime CreatedAt { get; set; }
        public bool IsHidden { get; set; }
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public bool IsFreeship { get; set; }
        public string? AvailableFrom { get; set; }
        public string? AvailableTo { get; set; }
        public bool IsAvailableNow { get; set; }
        public string Status { get; set; } = string.Empty;
        public string RestaurantAddress { get; set; } = string.Empty;
        public double? RestaurantLatitude { get; set; }
        public double? RestaurantLongitude { get; set; }
    }
}
