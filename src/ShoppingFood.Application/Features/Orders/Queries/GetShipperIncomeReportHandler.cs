using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Order;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
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
                var skip = Math.Max(0, request.Skip);
                var take = request.Take <= 0 ? 10 : Math.Min(request.Take, 50);

                // Lightweight load for chart + totals (no includes)
                var orders = await _orderRepository.GetAsync(
                    predicate: o => o.ShipperId == shipperProfile.Id &&
                                    (o.Status == Domain.Enums.OrderStatus.Delivered || o.Status == Domain.Enums.OrderStatus.Cancelled) &&
                                    o.UpdatedAt >= startDate &&
                                    o.UpdatedAt <= endDate);

                var deliveredOrders = orders.Where(o => o.Status == Domain.Enums.OrderStatus.Delivered).ToList();

                var dailyReports = deliveredOrders.GroupBy(o => o.UpdatedAt.Date).Select(g =>
                {
                    var ordersInDay = g.ToList();
                    return new DailyIncomeReportDto
                    {
                        Date = g.Key.ToString("yyyy-MM-dd"),
                        CompletedOrdersCount = ordersInDay.Count,
                        BaseFees = ordersInDay.Sum(o => o.ShipperBaseFeeAmount),
                        DistanceFees = ordersInDay.Sum(o => o.ShipperDistanceFeeAmount),
                        Bonus = ordersInDay.Sum(o => o.ShipperPeakBonus),
                        TotalIncome = ordersInDay.Sum(o => o.ShipperIncome)
                    };
                }).OrderBy(d => d.Date).ToList();

                var ordered = orders.OrderByDescending(o => o.UpdatedAt).ToList();
                var orderDtos = ordered
                    .Skip(skip)
                    .Take(take)
                    .Select(o => new ShipperCompletedOrderDto
                    {
                        OrderId = o.Id,
                        Status = o.Status.ToString(),
                        TotalAmount = o.TotalAmount,
                        ShippingFee = o.ShippingFee,
                        ItemsSubtotal = o.ItemsSubtotal > 0 ? o.ItemsSubtotal : Math.Max(0, o.TotalAmount - o.ShippingFee),
                        BaseFee = o.ShipperBaseFeeAmount,
                        DistanceFee = o.ShipperDistanceFeeAmount,
                        PeakBonus = o.ShipperPeakBonus,
                        TotalIncome = o.ShipperIncome,
                        PaymentMethod = o.PaymentMethod.ToString(),
                        DeliveryAddress = o.DeliveryAddress,
                        ContactName = o.ContactName,
                        CompletedAt = o.UpdatedAt
                    }).ToList();

                var result = new ShipperIncomeReportDto
                {
                    CompletedOrdersCount = deliveredOrders.Count,
                    TotalBaseFees = dailyReports.Sum(d => d.BaseFees),
                    TotalDistanceFees = dailyReports.Sum(d => d.DistanceFees),
                    TotalBonuses = dailyReports.Sum(d => d.Bonus),
                    TotalIncome = dailyReports.Sum(d => d.TotalIncome),
                    DailyReports = dailyReports,
                    Orders = orderDtos,
                    OrdersTotalCount = ordered.Count,
                    Skip = skip,
                    Take = take
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
                include: q => q.Include(u => u.Profile));
            var shipperProfile = users.FirstOrDefault()?.Profile;

            if (shipperProfile == null)
                return null;

            var profiles = await _shipperProfileReporitory.GetAsync(
                predicate: p => p.UserProfileId == shipperProfile.Id,
                include: q => q.Include(p => p.UserProfile),
                disableTracking: true);

            return profiles.FirstOrDefault();
        }
    }
}
