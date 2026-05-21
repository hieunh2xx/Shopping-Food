using System;
using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class SearchProductQuery : BaseQuery, IRequest<ApiResponse>
    {
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public Guid? RestaurantId { get; set; }
        public string? SortBy { get; set; }
    }
}
