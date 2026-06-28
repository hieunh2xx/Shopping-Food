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
        public Guid? CategoryId { get; set; }
        public string? SortBy { get; set; }
        public double? MinRating { get; set; }
        public bool? IsFreeship { get; set; }
        public double? UserLatitude { get; set; }
        public double? UserLongitude { get; set; }
        public double? MaxDistanceInKm { get; set; }
        public string? Status { get; set; }
    }
}
