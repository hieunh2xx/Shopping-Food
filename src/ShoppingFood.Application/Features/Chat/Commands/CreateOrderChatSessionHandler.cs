using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

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
                include: q => q.Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Restaurant),
                disableTracking: true);

            var order = orders.FirstOrDefault();
            if (order == null)
                return ApiResponse.Failure(404, "Đơn hàng không tồn tại.");

            if (order.UserAccountId != request.CurrentUserId)
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

            var restaurantId = order.Items.FirstOrDefault()?.Product?.RestaurantId;
            if (!restaurantId.HasValue)
                return ApiResponse.Failure(400, "Không xác định được nhà hàng của đơn.");

            var existing = await _chatSessionRepository.GetAsync(
                predicate: s => s.OrderId == request.OrderId && s.Status == ChatSessionStatus.Open,
                include: q => q.Include(s => s.Messages),
                disableTracking: true);

            var session = existing.FirstOrDefault();
            if (session != null)
                return ApiResponse.Success(MapSession(session), "Đã mở phiên chat với người bán.");

            var newSession = new ChatSession
            {
                Id = Guid.NewGuid(),
                UserId = request.CurrentUserId.Value,
                OrderId = request.OrderId,
                RestaurantId = restaurantId,
                Topic = ChatTopic.OrderCancellation,
                Status = ChatSessionStatus.Open,
                CreatedAt = DateTime.UtcNow
            };

            _chatSessionRepository.Add(newSession);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(MapSession(newSession), "Đã tạo phiên chat với người bán.");
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
