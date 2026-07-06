using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Chat.Commands
{
    public class CreateOrderChatSessionCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid OrderId { get; set; }
    }
}
