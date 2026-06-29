using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Coordinator.Queries
{
    public class GetOrderDispatchHistoryQuery : BaseQuery, IRequest<ApiResponse>
    {
        public Guid OrderId { get; set; }
    }
}
