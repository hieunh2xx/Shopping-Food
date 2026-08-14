namespace ShoppingFood.Domain.Models
{
    public class PlatformFinanceConfig
    {
        public Guid Id { get; set; }
        public decimal CommissionRate { get; set; } = 0.10m;
        public decimal DefaultShipperDebtLimit { get; set; } = 5_000_000m;
        public decimal BaseDeliveryFee { get; set; } = 15000m;
        public decimal FeePerKm { get; set; } = 5000m;
        public decimal RushHourMultiplier { get; set; } = 1.2m;
        public TimeSpan RushHourStartTime { get; set; } = new TimeSpan(17, 0, 0);
        public TimeSpan RushHourEndTime { get; set; } = new TimeSpan(19, 0, 0);
        
        public decimal ShipperBaseFee { get; set; } = 12000m;
        public decimal ShipperFeePerKm { get; set; } = 4000m;
        public decimal ShipperRushHourBonus { get; set; } = 10m; // Default to 10%

        public decimal MinWithdrawalAmount { get; set; } = 50_000m;
        public decimal LargeWithdrawalThreshold { get; set; } = 5_000_000m;
        /// <summary>Phí duy trì nhà hàng mỗi tháng (trừ ví seller).</summary>
        public decimal SellerMaintenanceFee { get; set; } = 0m;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
