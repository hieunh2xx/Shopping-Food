using System;
using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class GetRecommendationsQuery : BaseQuery, IRequest<ApiResponse>
    {
        public int Take { get; set; } = 8;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}
