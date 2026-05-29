using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Carts.Queries
{
    public class ClearCartQuery : BaseQuery, IRequest<ApiResponse>
    {
        public Guid? GuestUserId { get; set; }
    }
}
