using System;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Domain.Models
{
    public class SellerApplication
    {
        public Guid Id { get; set; }
        public Guid UserProfileId { get; set; }
        public string BusinessName { get; set; } = string.Empty;
        public string BusinessAddress { get; set; } = string.Empty;
        public string BusinessLicenseUrl { get; set; } = string.Empty;
        public string ShopImageUrl { get; set; } = string.Empty;
        public string ContactInfo { get; set; } = string.Empty;
        public SellerApplicationStatus Status { get; set; } = SellerApplicationStatus.Pending;
        public Guid? ReviewedBy { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual UserProfile UserProfile { get; set; } = null!;
        public virtual UserProfile? Reviewer { get; set; }
        public virtual RestaurantProfile? RestaurantProfile { get; set; }
    }
}
