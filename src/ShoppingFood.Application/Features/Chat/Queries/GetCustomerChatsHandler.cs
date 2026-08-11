using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Chat.Queries
{
    public class GetCustomerChatsHandler : IRequestHandler<GetCustomerChatsQuery, ApiResponse>
    {
        private readonly IChatSessionRepository _chatSessionRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;

        public GetCustomerChatsHandler(
            IChatSessionRepository chatSessionRepository,
            IRestaurantProfileRepository restaurantProfileRepository)
        {
            _chatSessionRepository = chatSessionRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
        }

        public async Task<ApiResponse> Handle(GetCustomerChatsQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var sessions = await _chatSessionRepository.GetAsync(
                predicate: s => s.UserId == request.CurrentUserId.Value && s.RestaurantId != null,
                include: q => q.Include(s => s.Messages),
                orderBy: q => q.OrderByDescending(s => s.CreatedAt),
                take: int.MaxValue,
                disableTracking: true);

            var restaurantIds = sessions
                .Where(s => s.RestaurantId.HasValue)
                .Select(s => s.RestaurantId!.Value)
                .Distinct()
                .ToList();

            var restaurants = restaurantIds.Count == 0
                ? new List<Domain.Models.RestaurantProfile>()
                : (await _restaurantProfileRepository.GetAsync(
                    predicate: r => restaurantIds.Contains(r.Id),
                    disableTracking: true)).ToList();

            var restaurantNames = restaurants.ToDictionary(r => r.Id, r => r.RestaurantName);

            // 1 cửa hàng = 1 hội thoại
            var result = sessions
                .GroupBy(s => s.RestaurantId!.Value)
                .Select(g =>
                {
                    var primary = g
                        .OrderByDescending(s =>
                            s.Messages.Count > 0
                                ? s.Messages.Max(m => m.CreatedAt)
                                : s.CreatedAt)
                        .First();

                    var lastMsg = g
                        .SelectMany(s => s.Messages)
                        .OrderByDescending(m => m.CreatedAt)
                        .FirstOrDefault();

                    var relatedOrderIds = g
                        .Where(s => s.OrderId.HasValue)
                        .Select(s => s.OrderId!.Value)
                        .Distinct()
                        .ToList();

                    var relatedSessionIds = g.Select(s => s.Id).Distinct().ToList();

                    return new
                    {
                        id = primary.Id,
                        userId = primary.UserId,
                        orderId = primary.OrderId ?? (relatedOrderIds.Count > 0 ? relatedOrderIds[0] : (Guid?)null),
                        relatedOrderIds,
                        relatedSessionIds,
                        restaurantId = primary.RestaurantId,
                        restaurantName = restaurantNames.TryGetValue(primary.RestaurantId!.Value, out var name)
                            ? name
                            : "Cửa hàng",
                        topic = primary.Topic.ToString(),
                        status = primary.Status.ToString(),
                        createdAt = primary.CreatedAt,
                        lastMessage = lastMsg?.Content,
                        lastMessageAt = lastMsg?.CreatedAt,
                        lastSenderRole = lastMsg?.SenderRole.ToString()
                    };
                })
                .OrderByDescending(s => s.lastMessageAt ?? s.createdAt)
                .ToList();

            return ApiResponse.Success(result, "Customer chats retrieved.");
        }
    }
}
