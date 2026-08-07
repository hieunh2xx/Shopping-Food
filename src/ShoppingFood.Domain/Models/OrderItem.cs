using System;

namespace ShoppingFood.Domain.Models
{
    public class OrderItem
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public Guid? ProductId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public string? SelectedSize { get; set; }
        public string? SelectedToppings { get; set; }

        // Navigation properties
        public virtual Order Order { get; set; } = null!;
        public virtual Product? Product { get; set; }
    }
}
