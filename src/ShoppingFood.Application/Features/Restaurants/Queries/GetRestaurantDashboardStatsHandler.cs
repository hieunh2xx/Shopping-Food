using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Restaurant;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Restaurants.Queries
{
    public class GetRestaurantDashboardStatsHandler : IRequestHandler<GetRestaurantDashboardStatsQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;

        public GetRestaurantDashboardStatsHandler(
            IOrderRepository orderRepository,
            IRestaurantProfileRepository restaurantProfileRepository)
        {
            _orderRepository = orderRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
        }

        public async Task<ApiResponse> Handle(GetRestaurantDashboardStatsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                {
                    return ApiResponse.Failure(401, "Unauthorized.");
                }

                // 1. Get restaurant owned by the seller
                var sellerRestaurants = await _restaurantProfileRepository.GetAsync(
                    predicate: r => r.Owner.UserAccountId == request.CurrentUserId.Value,
                    disableTracking: true
                );
                var restaurant = sellerRestaurants.FirstOrDefault();
                if (restaurant == null)
                {
                    return ApiResponse.Failure(403, "You do not own any restaurants on the system.");
                }

                // Default date range: past 30 days if not provided
                var start = request.StartDate ?? DateTime.UtcNow.AddDays(-30);
                var end = request.EndDate ?? DateTime.UtcNow;

                // 2. Fetch all orders matching the restaurant and date range
                var orders = await _orderRepository.GetAsync(
                    predicate: o => o.Items.Any(i => i.Product != null && i.Product.RestaurantId == restaurant.Id) &&
                                    o.CreatedAt >= start && o.CreatedAt <= end,
                    include: q => q.Include(o => o.Items).ThenInclude(i => i.Product),
                    take: int.MaxValue,
                    disableTracking: true
                );

                var totalOrders = orders.Count;
                var cancelledOrders = orders.Count(o => o.Status == OrderStatus.Cancelled);
                var cancellationRate = totalOrders > 0 ? (double)cancelledOrders / totalOrders * 100 : 0;

                // Delivered orders for revenue & best sellers
                var deliveredOrders = orders.Where(o => o.Status == OrderStatus.Delivered).ToList();
                
                // Get all order items belonging to this restaurant from delivered orders
                var restaurantItems = deliveredOrders
                    .SelectMany(o => o.Items)
                    .Where(i => i.Product != null && i.Product.RestaurantId == restaurant.Id)
                    .ToList();

                var totalRevenue = restaurantItems.Sum(i => i.TotalPrice);
                var totalPlatformCommission = deliveredOrders.Sum(o => o.PlatformCommission);
                var totalSellerPayout = deliveredOrders.Sum(o => o.SellerPayout);

                // Group by product name to get best sellers
                var bestSellers = restaurantItems
                    .GroupBy(i => i.ItemName)
                    .Select(g => new RestaurantBestSellerDto
                    {
                        ItemName = g.Key,
                        Quantity = g.Sum(i => i.Quantity),
                        Revenue = g.Sum(i => i.TotalPrice)
                    })
                    .OrderByDescending(x => x.Quantity)
                    .Take(5)
                    .ToList();

                var statsDto = new RestaurantDashboardStatsDto
                {
                    TotalRevenue = totalRevenue,
                    TotalPlatformCommission = totalPlatformCommission,
                    TotalSellerPayout = totalSellerPayout,
                    TotalOrders = totalOrders,
                    CancelledOrders = cancelledOrders,
                    CancellationRate = Math.Round(cancellationRate, 2),
                    BestSellers = bestSellers,
                    AverageRating = restaurant.AverageRating,
                    ReviewCount = restaurant.ReviewCount
                };

                return ApiResponse.Success(statsDto, "Restaurant dashboard statistics retrieved successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}
