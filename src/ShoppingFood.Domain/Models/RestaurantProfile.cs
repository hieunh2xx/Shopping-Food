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
        public string? BannerUrl { get; set; }
        public RestaurantStatus Status { get; set; } = RestaurantStatus.Active;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public TimeSpan? OpeningTime { get; set; }
        public TimeSpan? ClosingTime { get; set; }
        public double? MaxDeliveryRadiusKm { get; set; }
        public decimal ShippingFee { get; set; } = 0;
        public DeliveryType DeliveryType { get; set; } = DeliveryType.PlatformDelivery;
        public double FreeDeliveryRadiusKm { get; set; } = 3.0;
        public decimal FreeShippingMinimumOrder { get; set; } = 0;
        public decimal? CustomCommissionRate { get; set; }
        /// <summary>Hoa hồng COD tự giao còn phải nộp về sàn (tương tự ShipperProfile.CodCollectedAmount).</summary>
        public decimal CodPayableAmount { get; set; } = 0;
        /// <summary>Lần cuối thu phí duy trì (UTC).</summary>
        public DateTime? LastMaintenanceFeeChargedAt { get; set; }
        public double AverageRating { get; set; } = 0.0;
        public int ReviewCount { get; set; } = 0;
        public bool IsVerified { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual SellerApplication SellerApplication { get; set; } = null!;
        public virtual UserProfile Owner { get; set; } = null!;
    }
}
