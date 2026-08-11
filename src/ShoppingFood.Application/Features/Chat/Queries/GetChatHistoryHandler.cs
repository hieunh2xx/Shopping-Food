using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
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

            var take = request.Take <= 0 ? 20 : Math.Min(request.Take, 100);
            var before = request.Before;

            List<Guid> sessionIds;
            if (session.RestaurantId.HasValue)
            {
                var relatedSessions = await _chatSessionRepository.GetAsync(
                    predicate: s => s.UserId == session.UserId && s.RestaurantId == session.RestaurantId,
                    disableTracking: true);
                sessionIds = relatedSessions.Select(s => s.Id).ToList();
            }
            else
            {
                sessionIds = new List<Guid> { request.SessionId };
            }

            // Lấy take+1 tin mới nhất (hoặc cũ hơn Before), sắp xếp giảm dần
            var batch = await _chatMessageRepository.GetAsync(
                predicate: m => sessionIds.Contains(m.SessionId)
                    && (!before.HasValue || m.CreatedAt < before.Value),
                orderBy: q => q.OrderByDescending(m => m.CreatedAt).ThenByDescending(m => m.Id),
                take: take + 1,
                disableTracking: true);

            var hasMore = batch.Count > take;
            var pageDesc = batch.Take(take).ToList();
            // Trả về tăng dần theo thời gian để FE append/prepend dễ
            var page = pageDesc.OrderBy(m => m.CreatedAt).ThenBy(m => m.Id).ToList();

            var items = page.Select(m => new
            {
                id = m.Id,
                sessionId = m.SessionId,
                senderId = m.SenderId,
                senderRole = m.SenderRole.ToString(),
                content = m.Content,
                createdAt = m.CreatedAt
            }).ToList();

            DateTime? nextBefore = page.Count > 0 ? page[0].CreatedAt : null;

            return ApiResponse.Success(new
            {
                items,
                hasMore,
                nextBefore
            }, "Chat history retrieved.");
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

            var usersList = await _userRepository.GetAsync(
                predicate: u => u.Id == userId,
                include: q => q.Include(u => u.Profile),
                disableTracking: true);
            var userProfile = usersList.FirstOrDefault()?.Profile;

            if (userProfile != null)
            {
                if (userProfile.Role == UserRole.Coordinator && session.Topic == ChatTopic.OrderIssue)
                    return true;
                if (userProfile.Role == UserRole.Admin && (session.Topic == ChatTopic.SystemIssue || session.Topic == ChatTopic.General))
                    return true;
            }

            return false;
        }
    }
}
