using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using ShoppingFood.Application.Services;

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
        private readonly BlacklistFilterService _blacklistFilterService;

        public ChatHub(
            IChatSessionRepository chatSessionRepository,
            IChatMessageRepository chatMessageRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            INotificationRepository notificationRepository,
            INotificationPushService notificationPushService,
            IUnitOfWork unitOfWork,
            BlacklistFilterService blacklistFilterService)
        {
            _chatSessionRepository = chatSessionRepository;
            _chatMessageRepository = chatMessageRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _notificationRepository = notificationRepository;
            _notificationPushService = notificationPushService;
            _unitOfWork = unitOfWork;
            _blacklistFilterService = blacklistFilterService;
        }

        public async Task JoinSession(string sessionId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);
        }

        public async Task JoinCoordinatorGroup()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "Support_Coordinator");
        }

        public async Task JoinAdminGroup()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "Support_Admin");
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
            try
            {
                System.IO.File.AppendAllText("chaterrors.txt", $"[SendMessage] Start: {sessionId}, {senderId}, {senderRole}, {content}\n");

                if (string.IsNullOrWhiteSpace(content)) 
                {
                    System.IO.File.AppendAllText("chaterrors.txt", "[SendMessage] Content is empty\n");
                    return;
                }

                if (!Guid.TryParse(sessionId, out var parsedSessionId) || !Guid.TryParse(senderId, out var parsedSenderId))
                {
                    System.IO.File.AppendAllText("chaterrors.txt", "[SendMessage] Guid parse failed\n");
                    return;
                }

                if (!Enum.TryParse<UserRole>(senderRole, true, out var roleEnum))
                {
                    System.IO.File.AppendAllText("chaterrors.txt", $"[SendMessage] Enum parse failed for {senderRole}, defaulting to Customer\n");
                    roleEnum = UserRole.Customer;
                }

                var sessions = await _chatSessionRepository.GetAsync(
                    predicate: s => s.Id == parsedSessionId,
                    disableTracking: true);
                var session = sessions.FirstOrDefault();
                if (session == null) 
                {
                    System.IO.File.AppendAllText("chaterrors.txt", "[SendMessage] Session null\n");
                    return;
                }

                var filteredContent = content.Trim();
                if (!string.IsNullOrWhiteSpace(filteredContent))
                {
                    filteredContent = await _blacklistFilterService.FilterContent(filteredContent);
                }

                var message = new ChatMessage
                {
                    Id = Guid.NewGuid(),
                    SessionId = parsedSessionId,
                    SenderId = parsedSenderId,
                    SenderRole = roleEnum,
                    Content = filteredContent,
                    CreatedAt = DateTime.UtcNow
                };
                
                System.IO.File.AppendAllText("chaterrors.txt", "[SendMessage] Adding to repo\n");
                _chatMessageRepository.Add(message);
                
                System.IO.File.AppendAllText("chaterrors.txt", "[SendMessage] Saving changes\n");
                await _unitOfWork.SaveChangesAsync();
                System.IO.File.AppendAllText("chaterrors.txt", "[SendMessage] Save successful\n");

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
                
                var supportGroup = GetSupportGroup(session.Topic);
                await Clients.Group(supportGroup).SendAsync("ReceiveMessage", payload);

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
                            TargetId = session.OrderId,
                            IsRead = false,
                            CreateAt = DateTime.UtcNow
                        };
                        _notificationRepository.Add(notification);
                        await _unitOfWork.SaveChangesAsync();

                        // Removed manual push because NotificationPushInterceptor handles it
                    }
                }
            }
            catch (Exception ex)
            {
                System.IO.File.AppendAllText("chaterrors.txt", $"[SendMessage] EXCEPTION: {ex}\n");
                throw;
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
                
                var supportGroup = GetSupportGroup(session.Topic);
                await Clients.Group(supportGroup).SendAsync("SupportJoined", sessionId, supportId);
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
                
                var supportGroup = GetSupportGroup(session.Topic);
                await Clients.Group(supportGroup).SendAsync("SessionClosed", sessionId);
            }
        }

        private string GetSupportGroup(ChatTopic topic)
        {
            return topic == ChatTopic.SystemIssue || topic == ChatTopic.General
                ? "Support_Admin"
                : "Support_Coordinator";
        }
    }
}
