using System;
using System.Collections.Generic;

namespace ShoppingFood.Domain.Models
{
    public class MenuCategory
    {
        public Guid Id { get; set; }
        public Guid RestaurantId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int SortOrder { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual RestaurantProfile Restaurant { get; set; } = null!;
        public virtual ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
