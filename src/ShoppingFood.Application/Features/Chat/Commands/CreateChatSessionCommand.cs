using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Chat.Commands
{
    public class CreateChatSessionCommand : BaseCommand, IRequest<ApiResponse>
    {
        public ChatTopic Topic { get; set; }
    }
}
