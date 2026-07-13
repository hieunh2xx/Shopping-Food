namespace ShoppingFood.Dto.System
{
    public class DeliverySettingsDto
    {
        public double? MaxDeliveryRadiusKm { get; set; }
        public double FreeDeliveryRadiusKm { get; set; }
        public decimal FreeShippingMinimumOrder { get; set; }
        public decimal ShippingFee { get; set; }
    }
}
