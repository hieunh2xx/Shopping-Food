using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Discount;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Discounts.Queries
{
    public class GetDiscountStatsHandler : IRequestHandler<GetDiscountStatsQuery, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IDiscountRepository _discountRepository;
        private readonly IOrderRepository _orderRepository;

        public GetDiscountStatsHandler(
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            IDiscountRepository discountRepository,
            IOrderRepository orderRepository)
        {
            _userRepository = userRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _discountRepository = discountRepository;
            _orderRepository = orderRepository;
        }

        public async Task<ApiResponse> Handle(GetDiscountStatsQuery request, CancellationToken cancellationToken)
        {
            if(!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null || (userProfile.Role != Domain.Enums.UserRole.Seller && userProfile.Role != Domain.Enums.UserRole.Mall))
                return ApiResponse.Failure(403, "Forbidden. Only sellers can view discount statistics.");

            var restaurants = await _restaurantProfileRepository.GetAsync(
                predicate: r => r.OwnerId == userProfile.Id,
                disableTracking: true
                );
            var restaurant = restaurants.FirstOrDefault();
            if(restaurant == null)
                return ApiResponse.Failure(404, "Restaurant profile not found for the current user.");

            var discounts = await _discountRepository.GetAsync(
                predicate: d => d.RestaurantId == restaurant.Id && !d.IsDeleted,
                orderBy: q => q.OrderByDescending(d => d.CreatedAt),
                disableTracking: true
                );
            if(!discounts.Any())
                return ApiResponse.Success(new List<DiscountStatDto>(), "No discounts found.", 0);   

            var discountIds = discounts.Select(d => d.Id).ToList();

            var ordersQuery = await _orderRepository.GetAsync(
                predicate: o => o.AppliedDiscountId.HasValue &&
                                discountIds.Contains(o.AppliedDiscountId.Value) &&
                                o.Status == Domain.Enums.OrderStatus.Delivered &&
                                (!request.FromDate.HasValue || o.CreatedAt >= request.FromDate.Value) &&
                                (!request.ToDate.HasValue || o.CreatedAt <= request.ToDate.Value),
                disableTracking: true
                );

            var orderStatsByDiscount = ordersQuery
                .GroupBy(o => o.AppliedDiscountId!.Value)
                .ToDictionary(g => g.Key, g => new
                {
                    TotalUsed = g.Count(),
                    TotalRevenue = g.Sum(o => o.TotalAmount)
                });

            var result = discounts.Select(d =>
            {
                var stats = orderStatsByDiscount.GetValueOrDefault(d.Id);
                return new DiscountStatDto
                {
                    DiscountId = d.Id,
                    Code = d.Code,
                    Title = d.Title,
                    Type = d.Type.ToString(),
                    Value = d.Value,
                    StartDate = d.StartDate,
                    EndDate = d.EndDate,
                    Status = d.Status.ToString(),
                    TotalUsed = stats?.TotalUsed ?? 0,
                    TotalRevenue = stats?.TotalRevenue ?? 0,
                    Quantity = d.Quantity,
                    RemainingQuantity = d.Quantity - d.UsedCount
                };
            }).ToList();

            return ApiResponse.Success(result, "Discount statistics retrieved successfully.");
        }
    }
}
