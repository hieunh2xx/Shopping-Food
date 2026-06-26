using System;
using System.Collections.Generic;

namespace ShoppingFood.Dto.Restaurant
{
    public class RestaurantDashboardStatsDto
    {
        public decimal TotalRevenue { get; set; }
        public int TotalOrders { get; set; }
        public int CancelledOrders { get; set; }
        public double CancellationRate { get; set; }
        public List<RestaurantBestSellerDto> BestSellers { get; set; } = new List<RestaurantBestSellerDto>();
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
    }
}
