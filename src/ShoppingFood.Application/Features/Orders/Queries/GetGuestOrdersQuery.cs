using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetGuestOrdersQuery : BaseQuery, IRequest<ApiResponse>
    {
        public Guid GuestUserId { get; set; }
    }
}
