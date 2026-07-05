using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Chat.Commands
{
    public class ClaimChatSessionCommand : IRequest<ApiResponse>
    {
        public Guid SessionId { get; set; }
        public Guid SupportId { get; set; }
        public Guid? CurrentUserId { get; set; }
    }
}
