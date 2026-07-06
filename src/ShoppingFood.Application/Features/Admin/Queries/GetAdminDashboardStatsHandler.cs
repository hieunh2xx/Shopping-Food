using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Dto.Admin;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetAdminDashboardStatsHandler : IRequestHandler<GetAdminDashboardStatsQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;

        public GetAdminDashboardStatsHandler(
            IOrderRepository orderRepository,
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantProfileRepository)
        {
            _orderRepository = orderRepository;
            _userRepository = userRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
        }

        public async Task<ApiResponse> Handle(GetAdminDashboardStatsQuery request, CancellationToken cancellationToken)
        {
            var endDate = DateTime.UtcNow;
            var startDate = endDate.AddDays(-request.Days);

            // Fetch orders that are delivered
            var query = await _orderRepository.GetAsync(o => o.Status == OrderStatus.Delivered);
            
            var allDeliveredOrders = query.ToList();

            var totalOrders = allDeliveredOrders.Count;
            var totalRevenue = allDeliveredOrders.Sum(o => o.TotalAmount);

            // Filter for chart data within the date range
            var chartOrders = allDeliveredOrders.Where(o => o.CreatedAt.Date >= startDate.Date && o.CreatedAt.Date <= endDate.Date).ToList();

            // Group by Date for Chart Data
            var groupedChartData = chartOrders
                .GroupBy(o => o.CreatedAt.Date)
                .Select(g => new RevenueChartDataDto
                {
                    Date = g.Key.ToString("MM/dd"),
                    Revenue = g.Sum(o => o.TotalAmount),
                    OrdersCount = g.Count()
                })
                .ToList();

            // Fill missing dates
            var finalChartData = new List<RevenueChartDataDto>();
            for (int i = request.Days - 1; i >= 0; i--)
            {
                var date = endDate.AddDays(-i).Date;
                var existing = groupedChartData.FirstOrDefault(x => x.Date == date.ToString("MM/dd"));
                if (existing != null)
                {
                    finalChartData.Add(existing);
                }
                else
                {
                    finalChartData.Add(new RevenueChartDataDto
                    {
                        Date = date.ToString("MM/dd"),
                        Revenue = 0,
                        OrdersCount = 0
                    });
                }
            }

            // Calculate Active Users (Users with active RefreshToken)
            var usersQuery = await _userRepository.GetAsync(u => u.RefreshTokenExpiryTime != null && u.RefreshTokenExpiryTime > DateTime.UtcNow);
            var activeUsers = usersQuery.Count();

            // New User Growth logic
            var prevStartDate = startDate.AddDays(-request.Days);

            var allUsers = (await _userRepository.GetAsync(
                include: query => query.Include(u => u.Profile)
            )).ToList();
            var allRestaurants = (await _restaurantProfileRepository.GetAllAsync()).ToList();

            var currentCustomers = allUsers.Count(u => u.Profile?.Role == UserRole.Customer && u.CreatedAt.Date >= startDate.Date && u.CreatedAt.Date <= endDate.Date);
            var prevCustomers = allUsers.Count(u => u.Profile?.Role == UserRole.Customer && u.CreatedAt.Date >= prevStartDate.Date && u.CreatedAt.Date < startDate.Date);
            var customerGrowth = prevCustomers == 0 ? (currentCustomers > 0 ? 100 : 0) : Math.Round(((double)(currentCustomers - prevCustomers) / prevCustomers) * 100, 2);

            var currentShippers = allUsers.Count(u => u.Profile?.Role == UserRole.Shipper && u.CreatedAt.Date >= startDate.Date && u.CreatedAt.Date <= endDate.Date);
            var prevShippers = allUsers.Count(u => u.Profile?.Role == UserRole.Shipper && u.CreatedAt.Date >= prevStartDate.Date && u.CreatedAt.Date < startDate.Date);
            var shipperGrowth = prevShippers == 0 ? (currentShippers > 0 ? 100 : 0) : Math.Round(((double)(currentShippers - prevShippers) / prevShippers) * 100, 2);

            var currentRestaurants = allRestaurants.Count(r => r.CreatedAt.Date >= startDate.Date && r.CreatedAt.Date <= endDate.Date);
            var prevRestaurants = allRestaurants.Count(r => r.CreatedAt.Date >= prevStartDate.Date && r.CreatedAt.Date < startDate.Date);
            var restaurantGrowth = prevRestaurants == 0 ? (currentRestaurants > 0 ? 100 : 0) : Math.Round(((double)(currentRestaurants - prevRestaurants) / prevRestaurants) * 100, 2);

            var result = new AdminDashboardStatsDto
            {
                TotalRevenue = totalRevenue,
                TotalOrders = totalOrders,
                ActiveUsers = activeUsers,
                RevenueChartData = finalChartData,
                NewCustomers = currentCustomers,
                CustomerGrowthRate = customerGrowth,
                NewShippers = currentShippers,
                ShipperGrowthRate = shipperGrowth,
                NewRestaurants = currentRestaurants,
                RestaurantGrowthRate = restaurantGrowth
            };

            return ApiResponse.Success(result);
        }
    }
}
