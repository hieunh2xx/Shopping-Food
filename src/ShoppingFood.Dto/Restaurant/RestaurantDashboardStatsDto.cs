using System;
using System.Collections.Generic;

namespace ShoppingFood.Dto.Restaurant
{
    public class RestaurantDashboardStatsDto
    {
        /// <summary>Doanh số món (tổng tiền món từ đơn Delivered).</summary>
        public decimal TotalRevenue { get; set; }
        /// <summary>Tổng chiết khấu sàn trên đơn đã giao (đã settle).</summary>
        public decimal TotalPlatformCommission { get; set; }
        /// <summary>Tổng phần nhà hàng nhận sau chiết khấu (SellerPayout).</summary>
        public decimal TotalSellerPayout { get; set; }
        public int TotalOrders { get; set; }
        public int CancelledOrders { get; set; }
        public double CancellationRate { get; set; }
        public List<RestaurantBestSellerDto> BestSellers { get; set; } = new List<RestaurantBestSellerDto>();
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
    }
}
