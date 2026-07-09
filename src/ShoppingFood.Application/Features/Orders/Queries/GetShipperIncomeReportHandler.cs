using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Order;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetShipperIncomeReportHandler : IRequestHandler<GetShipperIncomeReportQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IShipperProfileRepository _shipperProfileReporitory;
        private readonly IUserRepository _userRepository;

        public GetShipperIncomeReportHandler(
            IOrderRepository orderRepository,
            IShipperProfileRepository shipperProfileRepository,
            IUserRepository userRepository)
        {
            _orderRepository = orderRepository;
            _shipperProfileReporitory = shipperProfileRepository;
            _userRepository = userRepository;
  
        }

        public async Task<ApiResponse> Handle(GetShipperIncomeReportQuery request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var shipperProfile = await GetActiveShipperProfileAsync(request.CurrentUserId.Value);
                if (shipperProfile == null)
                    return ApiResponse.Failure(403, "Forbidden. Only active shippers can perform this action.");

                var startDate = request.StartDate ?? DateTime.UtcNow.AddDays(-7);
                var endDate = request.EndDate ?? DateTime.UtcNow;

                var orders = await _orderRepository.GetAsync(
                    predicate: o => o.ShipperId == shipperProfile.Id &&
                                    o.Status == Domain.Enums.OrderStatus.Delivered &&
                                    o.UpdatedAt >= startDate &&
                                    o.UpdatedAt <= endDate,
                    disableTracking: true
                    
                    );

                var dailyReports = orders.GroupBy(o => o.UpdatedAt.Date).Select(g =>
                {
                    var ordersInDay = g.ToList();
                    var dayBaseFee = ordersInDay.Sum(o => o.ShipperBaseFeeAmount);
                    var dayDistanceFee = ordersInDay.Sum(o => o.ShipperDistanceFeeAmount);
                    var dayBonus = ordersInDay.Sum(o => o.ShipperPeakBonus);
                    var dayTotalIncome = ordersInDay.Sum(o => o.ShipperIncome);

                    return new DailyIncomeReportDto
                    {
                        Date = g.Key.ToString("yyyy-MM-dd"),
                        CompletedOrdersCount = ordersInDay.Count,
                        BaseFees = dayBaseFee,
                        DistanceFees = dayDistanceFee,
                        Bonus = dayBonus,
                        TotalIncome = dayTotalIncome
                    };
                }).OrderBy(d => d.Date).ToList();

                var completedOrderCount = orders.Count();
                var totalBaseFees = dailyReports.Sum(d => d.BaseFees);
                var totalDistanceFees = dailyReports.Sum(d => d.DistanceFees);
                var totalBonuses = dailyReports.Sum(d => d.Bonus);
                var totalIncome = dailyReports.Sum(d => d.TotalIncome);

                var result = new ShipperIncomeReportDto
                {
                    CompletedOrdersCount = completedOrderCount,
                    TotalBaseFees = totalBaseFees,
                    TotalDistanceFees = totalDistanceFees,
                    TotalBonuses = totalBonuses,
                    TotalIncome = totalIncome,
                    DailyReports = dailyReports,
                };

                return ApiResponse.Success(result, "Successfully retrieved shipper income report.");
            }
            catch (Exception ex)
            {
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task<ShipperProfile?> GetActiveShipperProfileAsync(Guid userId)
        {
            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == userId,
                include: q => q.Include(u => u.Profile)
                );
            var shipperProfile = users.FirstOrDefault()?.Profile;

            if (shipperProfile == null)
                return null;

            var profiles = await _shipperProfileReporitory.GetAsync(
                predicate: p => p.UserProfileId == shipperProfile.Id,
                include: q => q.Include(p => p.UserProfile),
                disableTracking: true

                );
            return profiles.FirstOrDefault();
        }
    }
}
