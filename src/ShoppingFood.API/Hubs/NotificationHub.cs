using Microsoft.AspNetCore.SignalR;

namespace ShoppingFood.API.Hubs
{
    public class NotificationHub : Hub
    {
        public async Task JoinUser(string userId)
        {
            if (Guid.TryParse(userId, out _))
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        public async Task LeaveUser(string userId)
        {
            if (Guid.TryParse(userId, out _))
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
    }
}
