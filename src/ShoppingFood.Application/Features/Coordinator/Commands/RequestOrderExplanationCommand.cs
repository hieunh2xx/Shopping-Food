using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class RequestOrderExplanationCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid OrderId { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
