namespace ShoppingFood.Dto.System
{
    public class DeliverySettingsDto
    {
        public double? MaxDeliveryRadiusKm { get; set; }
        public double FreeDeliveryRadiusKm { get; set; }
        public decimal FreeShippingMinimumOrder { get; set; }
        /// <summary>Phí giao hàng mặc định — số khách trả trên checkout.</summary>
        public decimal ShippingFee { get; set; }

        /// <summary>Phí khách / km vượt ngưỡng (từ PlatformFinanceConfig.FeePerKm).</summary>
        public decimal FeePerKm { get; set; }

        /// <summary>Thu nhập shipper cơ bản (tham chiếu hiển thị; tính trả shipper dùng PlatformFinanceConfig).</summary>
        public decimal ShipperBaseFee { get; set; } = 12000m;
        /// <summary>Thu nhập shipper / km (tham chiếu; không dùng làm phí khách).</summary>
        public decimal ShipperFeePerKm { get; set; } = 4000m;
        public decimal RushHourMultiplier { get; set; } = 1.2m;
        public string? RushHourStartTime { get; set; }
        public string? RushHourEndTime { get; set; }
        /// <summary>Số km đã gồm trong phí cơ bản (đồng bộ công thức trả shipper).</summary>
        public double IncludedKmInBaseFee { get; set; } = 5.0;
    }
}
