using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Products.Toppings.Queries
{
    public class DeleteToppingQuery : BaseQuery, IRequest<ApiResponse>
    {
        public Guid Id { get; set; }
        public DeleteToppingQuery(Guid id)
        {
            Id = id;
        }
    }
}
