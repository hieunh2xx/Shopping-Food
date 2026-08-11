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
        private const decimal VatRate = 0.08m;

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
            var endDate = DateTime.UtcNow.Date;
            var startDate = endDate.AddDays(-(request.Days - 1));

            // Đơn đã giao trong kỳ — dùng để đối soát thanh toán admin ↔ seller/shipper
            var deliveredInPeriod = (await _orderRepository.GetAsync(
                o => o.Status == OrderStatus.Delivered
                    && o.CreatedAt.Date >= startDate
                    && o.CreatedAt.Date <= endDate
            )).ToList();

            var grossMerchandiseValue = deliveredInPeriod.Sum(o => o.TotalAmount);
            var totalPlatformRevenue = deliveredInPeriod.Sum(o => o.PlatformCommission);
            var totalSellerPayout = deliveredInPeriod.Sum(o => o.SellerPayout);
            var totalShipperIncome = deliveredInPeriod.Sum(o => o.ShipperIncome);
            var estimatedTax = Math.Round(totalPlatformRevenue * VatRate, 0);
            var netPlatformRevenue = totalPlatformRevenue - estimatedTax;

            var groupedChartData = deliveredInPeriod
                .GroupBy(o => o.CreatedAt.Date)
                .Select(g => new RevenueChartDataDto
                {
                    Date = g.Key.ToString("MM/dd"),
                    Gmv = g.Sum(o => o.TotalAmount),
                    PlatformRevenue = g.Sum(o => o.PlatformCommission),
                    SellerPayout = g.Sum(o => o.SellerPayout),
                    ShipperIncome = g.Sum(o => o.ShipperIncome),
                    Revenue = g.Sum(o => o.PlatformCommission),
                    OrdersCount = g.Count()
                })
                .ToDictionary(x => x.Date, x => x);

            var finalChartData = new List<RevenueChartDataDto>();
            for (int i = request.Days - 1; i >= 0; i--)
            {
                var date = endDate.AddDays(-i);
                var key = date.ToString("MM/dd");
                if (groupedChartData.TryGetValue(key, out var existing))
                {
                    finalChartData.Add(existing);
                }
                else
                {
                    finalChartData.Add(new RevenueChartDataDto
                    {
                        Date = key,
                        Revenue = 0,
                        Gmv = 0,
                        PlatformRevenue = 0,
                        SellerPayout = 0,
                        ShipperIncome = 0,
                        OrdersCount = 0
                    });
                }
            }

            var usersQuery = await _userRepository.GetAsync(u => u.RefreshTokenExpiryTime != null && u.RefreshTokenExpiryTime > DateTime.UtcNow);
            var activeUsers = usersQuery.Count();

            var prevStartDate = startDate.AddDays(-request.Days);
            var prevEndDate = startDate.AddDays(-1);

            var allUsers = (await _userRepository.GetAsync(
                include: query => query.Include(u => u.Profile)
            )).ToList();
            var allRestaurants = (await _restaurantProfileRepository.GetAllAsync()).ToList();

            var currentCustomers = allUsers.Count(u => u.Profile?.Role == UserRole.Customer && u.CreatedAt.Date >= startDate && u.CreatedAt.Date <= endDate);
            var prevCustomers = allUsers.Count(u => u.Profile?.Role == UserRole.Customer && u.CreatedAt.Date >= prevStartDate && u.CreatedAt.Date <= prevEndDate);
            var customerGrowth = prevCustomers == 0 ? (currentCustomers > 0 ? 100 : 0) : Math.Round(((double)(currentCustomers - prevCustomers) / prevCustomers) * 100, 2);

            var currentShippers = allUsers.Count(u => u.Profile?.Role == UserRole.Shipper && u.CreatedAt.Date >= startDate && u.CreatedAt.Date <= endDate);
            var prevShippers = allUsers.Count(u => u.Profile?.Role == UserRole.Shipper && u.CreatedAt.Date >= prevStartDate && u.CreatedAt.Date <= prevEndDate);
            var shipperGrowth = prevShippers == 0 ? (currentShippers > 0 ? 100 : 0) : Math.Round(((double)(currentShippers - prevShippers) / prevShippers) * 100, 2);

            var currentRestaurants = allRestaurants.Count(r => r.CreatedAt.Date >= startDate && r.CreatedAt.Date <= endDate);
            var prevRestaurants = allRestaurants.Count(r => r.CreatedAt.Date >= prevStartDate && r.CreatedAt.Date <= prevEndDate);
            var restaurantGrowth = prevRestaurants == 0 ? (currentRestaurants > 0 ? 100 : 0) : Math.Round(((double)(currentRestaurants - prevRestaurants) / prevRestaurants) * 100, 2);

            var result = new AdminDashboardStatsDto
            {
                GrossMerchandiseValue = grossMerchandiseValue,
                TotalRevenue = totalPlatformRevenue,
                TotalSellerPayout = totalSellerPayout,
                TotalShipperIncome = totalShipperIncome,
                EstimatedTax = estimatedTax,
                NetPlatformRevenue = netPlatformRevenue,
                TotalOrders = deliveredInPeriod.Count,
                ActiveUsers = activeUsers,
                PeriodDays = request.Days,
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
