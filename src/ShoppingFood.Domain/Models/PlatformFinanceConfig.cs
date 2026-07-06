namespace ShoppingFood.Domain.Models
{
    public class PlatformFinanceConfig
    {
        public Guid Id { get; set; }
        public decimal CommissionRate { get; set; } = 0.10m;
        public decimal DefaultShipperDebtLimit { get; set; } = 5_000_000m;
        public decimal ShipperDeliveryBonus { get; set; } = 5_000m;
        public decimal MinWithdrawalAmount { get; set; } = 50_000m;
        public decimal LargeWithdrawalThreshold { get; set; } = 5_000_000m;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
