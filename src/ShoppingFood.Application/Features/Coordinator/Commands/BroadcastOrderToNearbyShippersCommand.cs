using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Text.Json.Serialization;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class BroadcastOrderToNearbyShippersCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid OrderId { get; set; }
    }
}
