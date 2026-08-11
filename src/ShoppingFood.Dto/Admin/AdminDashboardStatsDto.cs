using System;
using System.Collections.Generic;

namespace ShoppingFood.Dto.Admin
{
    public class AdminDashboardStatsDto
    {
        /// <summary>GMV trong kỳ = tổng tiền khách thanh toán.</summary>
        public decimal GrossMerchandiseValue { get; set; }
        /// <summary>Doanh thu sàn trong kỳ = tổng PlatformCommission.</summary>
        public decimal TotalRevenue { get; set; }
        /// <summary>Tổng cần trả seller trong kỳ.</summary>
        public decimal TotalSellerPayout { get; set; }
        /// <summary>Tổng thu nhập shipper trong kỳ.</summary>
        public decimal TotalShipperIncome { get; set; }
        /// <summary>VAT ước tính trên doanh thu sàn (8%).</summary>
        public decimal EstimatedTax { get; set; }
        /// <summary>Doanh thu sàn sau VAT ước tính.</summary>
        public decimal NetPlatformRevenue { get; set; }
        public int TotalOrders { get; set; }
        public int ActiveUsers { get; set; }
        public int PeriodDays { get; set; }
        public List<RevenueChartDataDto> RevenueChartData { get; set; } = new List<RevenueChartDataDto>();

        // Growth stats
        public int NewCustomers { get; set; }
        public double CustomerGrowthRate { get; set; }
        public int NewShippers { get; set; }
        public double ShipperGrowthRate { get; set; }
        public int NewRestaurants { get; set; }
        public double RestaurantGrowthRate { get; set; }
    }

    public class RevenueChartDataDto
    {
        public string Date { get; set; } = string.Empty; // Format: "MM/dd"
        /// <summary>Giữ field cũ = doanh thu sàn (tương thích FE cũ).</summary>
        public decimal Revenue { get; set; }
        public decimal Gmv { get; set; }
        public decimal PlatformRevenue { get; set; }
        public decimal SellerPayout { get; set; }
        public decimal ShipperIncome { get; set; }
        public int OrdersCount { get; set; }
    }
}
