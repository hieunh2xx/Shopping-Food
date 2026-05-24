using System;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Domain.Models
{
    public class RestaurantProfile
    {
        public Guid Id { get; set; }
        public Guid SellerApplicationId { get; set; }
        public Guid OwnerId { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public RestaurantStatus Status { get; set; } = RestaurantStatus.Active;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual SellerApplication SellerApplication { get; set; } = null!;
        public virtual UserProfile Owner { get; set; } = null!;
    }
}
