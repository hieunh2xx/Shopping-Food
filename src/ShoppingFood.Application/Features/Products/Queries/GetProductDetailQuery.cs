using System;
using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class GetProductDetailQuery : IRequest<ApiResponse>
    {
        public Guid Id { get; }

        public GetProductDetailQuery(Guid id)
        {
            Id = id;
        }
    }
}
