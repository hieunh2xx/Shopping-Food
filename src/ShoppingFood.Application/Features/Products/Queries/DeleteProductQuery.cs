using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class DeleteProductQuery : IRequest<ApiResponse>
    {
        public Guid Id { get; set; }

        public DeleteProductQuery(Guid id)
        {
            Id = id;
        }
    }
}
