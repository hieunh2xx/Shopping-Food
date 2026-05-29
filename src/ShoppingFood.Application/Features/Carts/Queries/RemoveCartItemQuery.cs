using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Carts.Queries
{
    public class RemoveCartItemQuery : BaseQuery, IRequest<ApiResponse>
    {
        public Guid ProductId { get; set; }
        public Guid? GuestUserId { get; set; }
    }
}
