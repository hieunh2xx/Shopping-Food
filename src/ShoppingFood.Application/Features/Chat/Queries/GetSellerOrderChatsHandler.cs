using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Chat.Queries
{
    public class GetSellerOrderChatsHandler : IRequestHandler<GetSellerOrderChatsQuery, ApiResponse>
    {
        private readonly IChatSessionRepository _chatSessionRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;

        public GetSellerOrderChatsHandler(
            IChatSessionRepository chatSessionRepository,
            IRestaurantProfileRepository restaurantProfileRepository)
        {
            _chatSessionRepository = chatSessionRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
        }

        public async Task<ApiResponse> Handle(GetSellerOrderChatsQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var restaurants = await _restaurantProfileRepository.GetAsync(
                predicate: r => r.Owner.UserAccountId == request.CurrentUserId.Value,
                disableTracking: true);

            var restaurant = restaurants.FirstOrDefault();
            if (restaurant == null)
                return ApiResponse.Failure(403, "Bạn chưa có nhà hàng.");

            var sessions = await _chatSessionRepository.GetAsync(
                predicate: s => s.RestaurantId == restaurant.Id,
                include: q => q
                    .Include(s => s.User).ThenInclude(u => u.Profile)
                    .Include(s => s.Messages),
                orderBy: q => q.OrderByDescending(s => s.CreatedAt),
                take: int.MaxValue,
                disableTracking: true);

            // 1 khách hàng = 1 hội thoại
            var result = sessions
                .GroupBy(s => s.UserId)
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

                    var customerName = primary.User?.Profile?.FullName
                        ?? primary.User?.UserName
                        ?? "Khách hàng";

                    return new
                    {
                        id = primary.Id,
                        userId = primary.UserId,
                        customerName,
                        orderId = primary.OrderId ?? (relatedOrderIds.Count > 0 ? relatedOrderIds[0] : (Guid?)null),
                        relatedOrderIds,
                        restaurantId = primary.RestaurantId,
                        topic = primary.Topic.ToString(),
                        status = primary.Status.ToString(),
                        createdAt = primary.CreatedAt,
                        lastMessage = lastMsg?.Content,
                        lastMessageAt = lastMsg?.CreatedAt
                    };
                })
                .OrderByDescending(s => s.lastMessageAt ?? s.createdAt)
                .ToList();

            return ApiResponse.Success(result, "Seller order chats retrieved.");
        }
    }
}
