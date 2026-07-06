using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class AdjustShipperReputationCommand : IRequest<ApiResponse>
    {
        public Guid ShipperId { get; set; }
        public double Points { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
