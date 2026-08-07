using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.Cart
{
    public class CartItemDto
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? ProductImageUrl { get; set; }
        public Guid RestaurantId { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal PriceAtAdded { get; set; }
        public bool IsProductDeleted { get; set; } = false;
        public string? SelectedSize { get; set; }
        public string? SelectedToppings { get; set; }
        public decimal TotalPrice => Quantity * PriceAtAdded;
        public List<ShoppingFood.Dto.Product.ProductSizeDto> Sizes { get; set; } = new List<ShoppingFood.Dto.Product.ProductSizeDto>();
        public List<ShoppingFood.Dto.Product.ProductToppingDto> Toppings { get; set; } = new List<ShoppingFood.Dto.Product.ProductToppingDto>();
    }
}
