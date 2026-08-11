using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Shippers.Commands
{
    public class SubmitOrderExplanationCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid OrderId { get; set; }
        public string Reply { get; set; } = string.Empty;
    }
}
