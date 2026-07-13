using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Coordinator;
using System.Collections.Generic;

namespace ShoppingFood.Application.Features.Coordinator.Queries
{
    public class GetOrderComplaintsQuery : BaseQuery, IRequest<ApiResponse>
    {
        public string? Status { get; set; }
    }
}
