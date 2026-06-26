using System;
using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Restaurants.Queries
{
    public class GetRestaurantDashboardStatsQuery : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }
}
