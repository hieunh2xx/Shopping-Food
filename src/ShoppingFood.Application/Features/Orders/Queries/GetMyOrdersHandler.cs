using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Dto.Order;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetMyOrdersHandler : IRequestHandler<GetMyOrdersQuery, ApiResponse>
    {
        private static readonly OrderStatus[] MessageableStatuses =
        {
            OrderStatus.Confirmed,
            OrderStatus.Preparing,
            OrderStatus.WaitingForShipper,
            OrderStatus.Shipping
        };

        private readonly IOrderRepository _orderRepository;
        private readonly IUserRepository _userRepository;
        private readonly IChatSessionRepository _chatSessionRepository;

        public GetMyOrdersHandler(
            IOrderRepository orderRepository,
            IUserRepository userRepository,
            IChatSessionRepository chatSessionRepository)
        {
            _orderRepository = orderRepository;
            _userRepository = userRepository;
            _chatSessionRepository = chatSessionRepository;
        }

        public async Task<ApiResponse> Handle(GetMyOrdersQuery request, CancellationToken cancellationToken)
        {
            var userList = await _userRepository.GetAsync(u => u.UserName == request.Username);
            var user = userList.FirstOrDefault();

            if (user == null)
                return ApiResponse.Failure(404, "User not found.");

            var orders = await _orderRepository.GetAsync(
                predicate: o => o.UserAccountId == user.Id,
                include: q => q.Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Restaurant),
                orderBy: q => q.OrderByDescending(o => o.CreatedAt),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true);

            var orderIds = orders.Select(o => o.Id).ToList();
            var chatSessions = orderIds.Count == 0
                ? new List<Domain.Models.ChatSession>()
                : (await _chatSessionRepository.GetAsync(
                    predicate: s => s.OrderId != null && orderIds.Contains(s.OrderId.Value) && s.Status == ChatSessionStatus.Open,
                    disableTracking: true)).ToList();

            var orderDtos = orders.Select(o =>
            {
                var restaurant = o.Items.FirstOrDefault()?.Product?.Restaurant;
                var chat = chatSessions.FirstOrDefault(s => s.OrderId == o.Id);
                return new OrderSummaryDto
                {
                    Id = o.Id,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status.ToString(),
                    PaymentMethod = o.PaymentMethod.ToString(),
                    CreatedAt = o.CreatedAt,
                    CanCancel = o.Status == OrderStatus.Pending,
                    CanMessageSeller = MessageableStatuses.Contains(o.Status),
                    RestaurantId = restaurant?.Id,
                    RestaurantName = restaurant?.RestaurantName,
                    OrderChatSessionId = chat?.Id
                };
            }).ToList();

            return ApiResponse.Success(orderDtos, "Orders retrieved successfully.");
        }
    }
}
