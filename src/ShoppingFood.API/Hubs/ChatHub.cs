using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.API.Hubs
{
    public class ChatHub : Hub
    {
        private readonly IChatSessionRepository _chatSessionRepository;
        private readonly IChatMessageRepository _chatMessageRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationPushService _notificationPushService;
        private readonly IUnitOfWork _unitOfWork;

        public ChatHub(
            IChatSessionRepository chatSessionRepository,
            IChatMessageRepository chatMessageRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            INotificationRepository notificationRepository,
            INotificationPushService notificationPushService,
            IUnitOfWork unitOfWork)
        {
            _chatSessionRepository = chatSessionRepository;
            _chatMessageRepository = chatMessageRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _notificationRepository = notificationRepository;
            _notificationPushService = notificationPushService;
            _unitOfWork = unitOfWork;
        }

        public async Task JoinSession(string sessionId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);
        }

        public async Task JoinSupportGroup()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "Support");
        }

        public async Task JoinSellerInbox(string restaurantId)
        {
            if (Guid.TryParse(restaurantId, out _))
                await Groups.AddToGroupAsync(Context.ConnectionId, $"seller_{restaurantId}");
        }

        public async Task LeaveSession(string sessionId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, sessionId);
        }

        public async Task SendMessage(string sessionId, string senderId, string senderRole, string content)
        {
            if (string.IsNullOrWhiteSpace(content)) return;

            if (!Guid.TryParse(sessionId, out var parsedSessionId) || !Guid.TryParse(senderId, out var parsedSenderId))
                return;

            if (!Enum.TryParse<UserRole>(senderRole, true, out var roleEnum))
                roleEnum = UserRole.Customer;

            var sessions = await _chatSessionRepository.GetAsync(
                predicate: s => s.Id == parsedSessionId,
                disableTracking: true);
            var session = sessions.FirstOrDefault();
            if (session == null) return;

            var message = new ChatMessage
            {
                Id = Guid.NewGuid(),
                SessionId = parsedSessionId,
                SenderId = parsedSenderId,
                SenderRole = roleEnum,
                Content = content.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            _chatMessageRepository.Add(message);
            await _unitOfWork.SaveChangesAsync();

            var payload = new
            {
                id = message.Id.ToString(),
                sessionId = message.SessionId.ToString(),
                senderId = message.SenderId.ToString(),
                senderRole = message.SenderRole.ToString(),
                content = message.Content,
                createdAt = message.CreatedAt.ToString("o"),
                orderId = session.OrderId?.ToString()
            };

            await Clients.Group(sessionId).SendAsync("ReceiveMessage", payload);
            await Clients.Group("Support").SendAsync("ReceiveMessage", payload);

            if (session.RestaurantId.HasValue)
            {
                await Clients.Group($"seller_{session.RestaurantId}")
                    .SendAsync("OrderChatMessage", payload);

                var recipientUserId = await ResolveRecipientUserIdAsync(session, parsedSenderId);
                if (recipientUserId.HasValue)
                {
                    var title = session.OrderId.HasValue
                        ? $"Tin nhắn đơn #{session.OrderId.Value.ToString()[..8]}"
                        : "Tin nhắn mới";
                    var notification = new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = recipientUserId.Value,
                        Title = title,
                        Message = content.Length > 120 ? content[..120] + "…" : content,
                        NotificationType = NotificationType.Order,
                        IsRead = false,
                        CreateAt = DateTime.UtcNow
                    };
                    _notificationRepository.Add(notification);
                    await _unitOfWork.SaveChangesAsync();

                    await _notificationPushService.PushToUserAsync(recipientUserId.Value, new
                    {
                        id = notification.Id,
                        title = notification.Title,
                        message = notification.Message,
                        notificationType = notification.NotificationType.ToString(),
                        isRead = false,
                        createAt = notification.CreateAt
                    });
                }
            }
        }

        private async Task<Guid?> ResolveRecipientUserIdAsync(ChatSession session, Guid senderId)
        {
            if (session.UserId == senderId)
            {
                if (!session.RestaurantId.HasValue) return null;
                var restaurants = await _restaurantProfileRepository.GetAsync(
                    predicate: r => r.Id == session.RestaurantId.Value,
                    include: q => q.Include(r => r.Owner),
                    disableTracking: true);
                return restaurants.FirstOrDefault()?.Owner?.UserAccountId;
            }

            return session.UserId;
        }

        public async Task ClaimSession(string sessionId, string supportId)
        {
            if (!Guid.TryParse(sessionId, out var parsedSessionId) || !Guid.TryParse(supportId, out var parsedSupportId))
                return;

            var sessions = await _chatSessionRepository.GetAsync(
                predicate: s => s.Id == parsedSessionId,
                disableTracking: false);
            var session = sessions.FirstOrDefault();
            if (session != null && session.SupportId == null)
            {
                session.SupportId = parsedSupportId;
                _chatSessionRepository.Update(session);
                await _unitOfWork.SaveChangesAsync();

                await Clients.Group(sessionId).SendAsync("SupportJoined", sessionId, supportId);
                await Clients.Group("Support").SendAsync("SupportJoined", sessionId, supportId);
            }
        }

        public async Task CloseSession(string sessionId)
        {
            if (!Guid.TryParse(sessionId, out var parsedSessionId)) return;

            var sessions = await _chatSessionRepository.GetAsync(
                predicate: s => s.Id == parsedSessionId,
                disableTracking: false);
            var session = sessions.FirstOrDefault();
            if (session != null)
            {
                session.Status = ChatSessionStatus.Closed;
                session.ClosedAt = DateTime.UtcNow;
                _chatSessionRepository.Update(session);
                await _unitOfWork.SaveChangesAsync();

                await Clients.Group(sessionId).SendAsync("SessionClosed", sessionId);
                await Clients.Group("Support").SendAsync("SessionClosed", sessionId);
            }
        }
    }
}
