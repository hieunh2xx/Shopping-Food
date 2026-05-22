using System;

namespace ShoppingFood.Dto.Product
{
    public class ProductToppingDto
    {
        public Guid Id { get; set; }
        public string ToppingName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsAvailable { get; set; }
    }
}
