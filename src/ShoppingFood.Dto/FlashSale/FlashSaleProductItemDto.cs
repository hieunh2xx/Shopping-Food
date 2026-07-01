using System;

namespace ShoppingFood.Dto.FlashSale
{
    public class FlashSaleProductItemDto
    {
        public Guid FlashSaleProductId { get; set; }
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public Guid RestaurantId { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public decimal OriginalPrice { get; set; }
        public decimal FlashSalePrice { get; set; }
        public int DiscountPercent { get; set; }
        public int QuantityLimit { get; set; }
        public int RemainingQuantity { get; set; }
    }
}
