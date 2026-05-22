using System;

namespace ShoppingFood.Dto.Product
{
    public class ProductSizeDto
    {
        public Guid Id { get; set; }
        public string SizeName { get; set; } = string.Empty;
        public decimal ExtraPrice { get; set; }
        public bool IsDefault { get; set; }
    }
}
