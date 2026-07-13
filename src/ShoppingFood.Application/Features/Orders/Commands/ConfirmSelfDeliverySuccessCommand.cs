using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class ConfirmSelfDeliverySuccessCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid OrderId { get; set; }
    }
}
