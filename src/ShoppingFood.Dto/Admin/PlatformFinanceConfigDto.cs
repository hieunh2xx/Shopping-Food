using System;

namespace ShoppingFood.Dto.Admin
{
    public class PlatformFinanceConfigDto
    {
        public decimal CommissionRate { get; set; }
        public decimal DefaultShipperDebtLimit { get; set; }
        
        public decimal BaseDeliveryFee { get; set; }
        public decimal FeePerKm { get; set; }
        public decimal RushHourMultiplier { get; set; }
        public string RushHourStartTime { get; set; } = "17:00:00";
        public string RushHourEndTime { get; set; } = "19:00:00";
        
        public decimal ShipperBaseFee { get; set; }
        public decimal ShipperFeePerKm { get; set; }
        public decimal ShipperRushHourBonus { get; set; }

        public decimal MinWithdrawalAmount { get; set; }
        public decimal LargeWithdrawalThreshold { get; set; }
    }
}
