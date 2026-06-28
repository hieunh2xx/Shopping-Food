using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class GetProductsQuery : BaseQuery, IRequest<ApiResponse>
    {
        public Guid? CategoryId { get; set; }
        public string? Status { get; set; }
    }
}
