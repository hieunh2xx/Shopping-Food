using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetOrderDetailsQuery : BaseQuery, IRequest<ApiResponse>
    {
        public Guid OrderId { get; set; }
    }
}
