namespace ShoppingFood.Dto.System
{
    public class PlatformStatsDto
    {
        public int RestaurantCount { get; set; }
        public int CustomerCount { get; set; }
        public int ProductCount { get; set; }
        public int OrderCount { get; set; }
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal FreeShippingMinimumOrder { get; set; }
        public double FreeDeliveryRadiusKm { get; set; }
        public double? MaxDeliveryRadiusKm { get; set; }
    }
}
