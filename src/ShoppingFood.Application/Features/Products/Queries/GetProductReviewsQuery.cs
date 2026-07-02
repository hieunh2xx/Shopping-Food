using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class GetProductReviewsQuery : BaseQuery, IRequest<ApiResponse>
    {
        public Guid ProductId { get; set; }
    }
}
