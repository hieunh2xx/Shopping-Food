using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Notifications.Commands
{
    public class MarkNotificationReadCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid NotificationId { get; set; }
    }
}
