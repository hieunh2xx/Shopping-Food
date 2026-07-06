using System;
using System.Collections.Generic;

namespace ShoppingFood.Dto.Admin
{
    public class AdminDashboardStatsDto
    {
        public decimal TotalRevenue { get; set; }
        public int TotalOrders { get; set; }
        public int ActiveUsers { get; set; }
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
        public decimal Revenue { get; set; }
        public int OrdersCount { get; set; }
    }
}
