using Microsoft.AspNetCore.SignalR;
using ShoppingFood.API.Hubs;
using ShoppingFood.Application.Interfaces;

namespace ShoppingFood.API.Services
{
    public class NotificationPushService : INotificationPushService
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationPushService(IHubContext<NotificationHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public Task PushToUserAsync(Guid userId, object payload, CancellationToken cancellationToken = default)
        {
            return _hubContext.Clients.Group($"user_{userId}")
                .SendAsync("NotificationReceived", payload, cancellationToken);
        }
    }
}
