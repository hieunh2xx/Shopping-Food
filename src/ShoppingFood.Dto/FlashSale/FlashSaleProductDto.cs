using System;

namespace ShoppingFood.Dto.FlashSale
{
    public class FlashSaleProductDto
    {
        public Guid Id { get; set; }
        public Guid FlashSaleId { get; set; }
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string RestaurantName { get; set; } = string.Empty;
        public decimal OriginalPrice { get; set; }
        public decimal FlashSalePrice { get; set; }
        public int QuantityLimit { get; set; }
        public int SoldQuantity { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? RejectReason { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
