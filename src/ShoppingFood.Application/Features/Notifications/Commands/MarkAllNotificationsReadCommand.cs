using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Notifications.Commands
{
    public class MarkAllNotificationsReadCommand : BaseCommand, IRequest<ApiResponse>
    {
    }
}
