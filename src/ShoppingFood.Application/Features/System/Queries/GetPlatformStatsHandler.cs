using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Features.Admin.Queries;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Dto.System;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.System.Queries
{
    public class GetPlatformStatsHandler : IRequestHandler<GetPlatformStatsQuery, ApiResponse>
    {
        private readonly ShoppingFoodContext _dbContext;
        private readonly IMediator _mediator;

        public GetPlatformStatsHandler(ShoppingFoodContext dbContext, IMediator mediator)
        {
            _dbContext = dbContext;
            _mediator = mediator;
        }

        public async Task<ApiResponse> Handle(GetPlatformStatsQuery request, CancellationToken cancellationToken)
        {
            var restaurantCount = await _dbContext.RestaurantProfiles
                .AsNoTracking()
                .CountAsync(r => r.Status == RestaurantStatus.Active, cancellationToken);

            var customerCount = await _dbContext.UserProfiles
                .AsNoTracking()
                .CountAsync(p => p.Role == UserRole.Customer, cancellationToken);

            var productCount = await _dbContext.Products
                .AsNoTracking()
                .CountAsync(p => !p.IsHidden && p.Status == ProductStatus.Approved, cancellationToken);

            var orderCount = await _dbContext.Orders
                .AsNoTracking()
                .CountAsync(cancellationToken);

            var reviewStats = await _dbContext.ProductReviews
                .AsNoTracking()
                .GroupBy(_ => 1)
                .Select(g => new { Count = g.Count(), Avg = g.Average(r => (double)r.Rating) })
                .FirstOrDefaultAsync(cancellationToken);

            // Prefer restaurant ratings when available; else product reviews
            var restaurantRatings = await _dbContext.RestaurantProfiles
                .AsNoTracking()
                .Where(r => r.Status == RestaurantStatus.Active && r.AverageRating > 0)
                .Select(r => r.AverageRating)
                .ToListAsync(cancellationToken);

            double averageRating = 0;
            int reviewCount = reviewStats?.Count ?? 0;
            if (restaurantRatings.Count > 0)
                averageRating = Math.Round(restaurantRatings.Average(), 1);
            else if (reviewStats != null && reviewStats.Count > 0)
                averageRating = Math.Round(reviewStats.Avg, 1);

            var delivery = await _mediator.Send(new GetDeliverySettingsQuery(), cancellationToken);

            var dto = new PlatformStatsDto
            {
                RestaurantCount = restaurantCount,
                CustomerCount = customerCount,
                ProductCount = productCount,
                OrderCount = orderCount,
                AverageRating = averageRating,
                ReviewCount = reviewCount,
                ShippingFee = delivery.ShippingFee,
                FreeShippingMinimumOrder = delivery.FreeShippingMinimumOrder,
                FreeDeliveryRadiusKm = delivery.FreeDeliveryRadiusKm,
                MaxDeliveryRadiusKm = delivery.MaxDeliveryRadiusKm
            };

            return ApiResponse.Success(dto, "Platform stats loaded.");
        }
    }
}
