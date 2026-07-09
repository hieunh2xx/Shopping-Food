using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
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
                predicate: s => s.RestaurantId == restaurant.Id
                    && s.OrderId != null,
                include: q => q.Include(s => s.User).Include(s => s.Messages),
                orderBy: q => q.OrderByDescending(s => s.CreatedAt),
                disableTracking: true);

            var result = sessions.Select(s => new
            {
                id = s.Id,
                userId = s.UserId,
                customerName = s.User?.UserName,
                orderId = s.OrderId,
                restaurantId = s.RestaurantId,
                topic = s.Topic.ToString(),
                status = s.Status.ToString(),
                createdAt = s.CreatedAt,
                lastMessage = s.Messages.OrderByDescending(m => m.CreatedAt).FirstOrDefault()?.Content,
                lastMessageAt = s.Messages.OrderByDescending(m => m.CreatedAt).FirstOrDefault()?.CreatedAt
            }).ToList();

            return ApiResponse.Success(result, "Seller order chats retrieved.");
        }
    }
}
