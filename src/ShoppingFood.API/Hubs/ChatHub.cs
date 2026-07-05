using Microsoft.AspNetCore.SignalR;
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
        private readonly IUnitOfWork _unitOfWork;

        public ChatHub(
            IChatSessionRepository chatSessionRepository,
            IChatMessageRepository chatMessageRepository,
            IUnitOfWork unitOfWork)
        {
            _chatSessionRepository = chatSessionRepository;
            _chatMessageRepository = chatMessageRepository;
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

        public async Task LeaveSession(string sessionId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, sessionId);
        }

        public async Task SendMessage(string sessionId, string senderId, string senderRole, string content)
        {
            if (string.IsNullOrWhiteSpace(content)) return;

            if (!Guid.TryParse(sessionId, out var parsedSessionId) || !Guid.TryParse(senderId, out var parsedSenderId))
            {
                return;
            }

            if (!Enum.TryParse<UserRole>(senderRole, true, out var roleEnum))
            {
                roleEnum = UserRole.Customer; // Fallback
            }

            var message = new ChatMessage
            {
                Id = Guid.NewGuid(),
                SessionId = parsedSessionId,
                SenderId = parsedSenderId,
                SenderRole = roleEnum,
                Content = content,
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
                createdAt = message.CreatedAt.ToString("o")
            };

            await Clients.Group(sessionId).SendAsync("ReceiveMessage", payload);
            await Clients.Group("Support").SendAsync("ReceiveMessage", payload);
        }

        public async Task ClaimSession(string sessionId, string supportId)
        {
            if (!Guid.TryParse(sessionId, out var parsedSessionId) || !Guid.TryParse(supportId, out var parsedSupportId))
            {
                return;
            }

            var sessions = await _chatSessionRepository.GetAsync(
                predicate: s => s.Id == parsedSessionId,
                disableTracking: false
                );
            var session = sessions.FirstOrDefault();
            if(session != null && session.SupportId == null)
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
                disableTracking: false
                );
            var session = sessions.FirstOrDefault();
            if(session != null)
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
