using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.Restaurant
{
    public class NearbyRestaurantDto
    {
        public Guid Id { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public string RestaurantAddress { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public string? OpeningTime { get; set; }
        public string? ClosingTime { get; set; }
        public double? MaxDeliveryRadius { get; set; }
        public decimal ShippingFee { get; set; }
        public double DistanceKm { get; set; }
    }
}
