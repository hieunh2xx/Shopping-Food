using System;
using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class GetProductDetailQuery : BaseQuery, IRequest<ApiResponse>
    {
        public Guid Id { get; set; }

        public GetProductDetailQuery(Guid id)
        {
            Id = id;
        }
    }
}
