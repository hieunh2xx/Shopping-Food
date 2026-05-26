using System;

namespace ShoppingFood.Domain.Models
{
    public class ProductTopping
    {
        public Guid ProductId { get; set; }
        public Guid ToppingId { get; set; }

        // Navigation properties
        public virtual Product Product { get; set; } = null!;
        public virtual Topping Topping { get; set; } = null!;
    }
}
