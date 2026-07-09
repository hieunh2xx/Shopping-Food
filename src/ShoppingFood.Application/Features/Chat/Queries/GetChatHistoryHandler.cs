using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Chat.Queries
{
    public class GetChatHistoryHandler : IRequestHandler<GetChatHistoryQuery, ApiResponse>
    {
        private readonly IChatMessageRepository _chatMessageRepository;
        private readonly IChatSessionRepository _chatSessionRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;

        public GetChatHistoryHandler(
            IChatMessageRepository chatMessageRepository,
            IChatSessionRepository chatSessionRepository,
            IUserRepository userRepository, 
            IRestaurantProfileRepository restaurantProfileRepository)
        {
            _chatMessageRepository = chatMessageRepository;
            _chatSessionRepository = chatSessionRepository;
            _userRepository = userRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
        }

        public async Task<ApiResponse> Handle(GetChatHistoryQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var sessions = await _chatSessionRepository.GetAsync(
                predicate: s => s.Id == request.SessionId,
                disableTracking: true);
            var session = sessions.FirstOrDefault();
            if (session == null)
                return ApiResponse.Failure(404, "Phiên chat không tồn tại.");

            if (!await CanAccessSessionAsync(session, request.CurrentUserId.Value))
                return ApiResponse.Failure(403, "Forbidden.");

            var messages = await _chatMessageRepository.GetAsync(
                predicate: m => m.SessionId == request.SessionId,
                orderBy: q => q.OrderBy(m => m.CreatedAt),
                take: int.MaxValue,
                disableTracking: true);

            var dtos = messages.Select(m => new
            {
                id = m.Id,
                sessionId = m.SessionId,
                senderId = m.SenderId,
                senderRole = m.SenderRole.ToString(),
                content = m.Content,
                createdAt = m.CreatedAt
            }).ToList();

            return ApiResponse.Success(dtos, "Chat history retrieved.");
        }

        private async Task<bool> CanAccessSessionAsync(ChatSession session, Guid userId)
        {
            if (session.UserId == userId || session.SupportId == userId)
                return true;

            var users = await _restaurantProfileRepository.GetAsync(
                predicate: r => r.Owner.UserAccountId == userId,
                disableTracking: true);
            var isSeller = users.Any();

            if (session.RestaurantId.HasValue && isSeller)
            {
                var restaurants = await _restaurantProfileRepository.GetAsync(
                    predicate: r => r.Id == session.RestaurantId.Value && r.Owner.UserAccountId == userId,
                    disableTracking: true);
                if (restaurants.Any())
                    return true;
            }

            // Check if user is Admin or Coordinator
            var usersList = await _userRepository.GetAsync(
                predicate: u => u.Id == userId,
                include: q => q.Include(u => u.Profile),
                disableTracking: true);
            var userProfile = usersList.FirstOrDefault()?.Profile;

            if (userProfile != null)
            {
                if (userProfile.Role == Domain.Enums.UserRole.Coordinator && session.Topic == ChatTopic.OrderIssue)
                    return true;
                if (userProfile.Role == Domain.Enums.UserRole.Admin && (session.Topic == ChatTopic.SystemIssue || session.Topic == ChatTopic.General))
                    return true;
            }

            return false;
        }
    }
}
