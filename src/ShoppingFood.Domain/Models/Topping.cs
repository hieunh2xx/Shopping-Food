using System;
using System.Collections.Generic;

namespace ShoppingFood.Domain.Models
{
    public class Topping
    {
        public Guid Id { get; set; }
        public Guid RestaurantId { get; set; }
        public string ToppingName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsAvailable { get; set; } = true;

        // Navigation properties
        public virtual RestaurantProfile Restaurant { get; set; } = null!;
        public virtual ICollection<ProductTopping> ProductToppings { get; set; } = new List<ProductTopping>();
    }
}
