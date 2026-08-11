using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Chat.Commands
{
    public class CreateOrderChatSessionHandler : IRequestHandler<CreateOrderChatSessionCommand, ApiResponse>
    {
        private static readonly OrderStatus[] MessageableStatuses =
        {
            OrderStatus.Confirmed,
            OrderStatus.Preparing,
            OrderStatus.WaitingForShipper,
            OrderStatus.Shipping,
            OrderStatus.Delivered
        };

        private readonly IOrderRepository _orderRepository;
        private readonly IChatSessionRepository _chatSessionRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateOrderChatSessionHandler(
            IOrderRepository orderRepository,
            IChatSessionRepository chatSessionRepository,
            IUnitOfWork unitOfWork)
        {
            _orderRepository = orderRepository;
            _chatSessionRepository = chatSessionRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(CreateOrderChatSessionCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == request.OrderId,
                include: q => q
                    .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Restaurant)
                    .ThenInclude(r => r.Owner),
                disableTracking: true);

            var order = orders.FirstOrDefault();
            if (order == null)
                return ApiResponse.Failure(404, "Đơn hàng không tồn tại.");

            var restaurant = order.Items.FirstOrDefault()?.Product?.Restaurant;
            var restaurantId = restaurant?.Id;
            if (!restaurantId.HasValue)
                return ApiResponse.Failure(400, "Không xác định được nhà hàng của đơn.");

            var isCustomer = order.UserAccountId == request.CurrentUserId;
            var isRestaurantOwner = restaurant?.Owner?.UserAccountId == request.CurrentUserId;

            if (!isCustomer && !isRestaurantOwner)
                return ApiResponse.Failure(403, "Bạn không có quyền nhắn tin về đơn này.");

            if (order.Status == OrderStatus.Cancelled)
                return ApiResponse.Failure(400, "Đơn hàng đã bị hủy, không thể nhắn tin.");

            if (!MessageableStatuses.Contains(order.Status))
            {
                return ApiResponse.Failure(400,
                    order.Status == OrderStatus.Pending
                        ? "Đơn chưa được xác nhận — bạn có thể hủy trực tiếp thay vì nhắn tin."
                        : "Không thể nhắn tin về đơn ở trạng thái hiện tại.");
            }

            // Nếu đơn đã giao, chỉ cho chat trong vòng 24 giờ
            if (order.Status == OrderStatus.Delivered)
            {
                var cutoff = DateTime.UtcNow.AddHours(-24);
                if (order.UpdatedAt < cutoff)
                    return ApiResponse.Failure(400, "Thời gian nhắn tin đã kết thúc (24 giờ sau khi giao hàng).");
            }

            // 1 hội thoại / cặp khách–cửa hàng: tái sử dụng session đang mở (mọi đơn của cùng NH)
            var customerUserId = order.UserAccountId ?? request.CurrentUserId.Value;
            var existingForPair = await _chatSessionRepository.GetAsync(
                predicate: s => s.UserId == customerUserId
                    && s.RestaurantId == restaurantId
                    && s.Status == ChatSessionStatus.Open,
                include: q => q.Include(s => s.Messages),
                disableTracking: false);

            var session = existingForPair
                .OrderByDescending(s => s.Messages.Count > 0
                    ? s.Messages.Max(m => m.CreatedAt)
                    : s.CreatedAt)
                .FirstOrDefault();

            if (session != null)
            {
                // Gắn đơn hiện tại để deep-link / ngữ cảnh đơn mới nhất
                if (session.OrderId != request.OrderId)
                {
                    session.OrderId = request.OrderId;
                    _chatSessionRepository.Update(session);
                    await _unitOfWork.SaveChangesAsync();
                }

                return ApiResponse.Success(MapSession(session),
                    isRestaurantOwner ? "Đã mở phiên chat với khách hàng." : "Đã mở phiên chat với người bán.");
            }

            // Session luôn gắn UserId = khách hàng (chủ đơn)
            if (!order.UserAccountId.HasValue)
            {
                if (isRestaurantOwner)
                    return ApiResponse.Failure(400, "Đơn khách vãng lai chưa gắn tài khoản — chưa thể chat.");
            }

            var newSession = new ChatSession
            {
                Id = Guid.NewGuid(),
                UserId = customerUserId,
                OrderId = request.OrderId,
                RestaurantId = restaurantId,
                Topic = ChatTopic.OrderCancellation,
                Status = ChatSessionStatus.Open,
                CreatedAt = DateTime.UtcNow
            };

            _chatSessionRepository.Add(newSession);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(MapSession(newSession),
                isRestaurantOwner ? "Đã tạo phiên chat với khách hàng." : "Đã tạo phiên chat với người bán.");
        }

        private static object MapSession(ChatSession session) => new
        {
            id = session.Id,
            userId = session.UserId,
            supportId = session.SupportId,
            orderId = session.OrderId,
            restaurantId = session.RestaurantId,
            topic = session.Topic.ToString(),
            status = session.Status.ToString(),
            createdAt = session.CreatedAt,
            closedAt = session.ClosedAt,
            messages = session.Messages?.OrderBy(m => m.CreatedAt).Select(m => (object)new
            {
                id = m.Id,
                sessionId = m.SessionId,
                senderId = m.SenderId,
                senderRole = m.SenderRole.ToString(),
                content = m.Content,
                createdAt = m.CreatedAt
            }).ToList() ?? new List<object>()
        };
    }
}
