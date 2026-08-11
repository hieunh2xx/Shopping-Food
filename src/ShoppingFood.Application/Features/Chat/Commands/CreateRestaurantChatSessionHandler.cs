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
    public class CreateRestaurantChatSessionHandler : IRequestHandler<CreateRestaurantChatSessionCommand, ApiResponse>
    {
        private readonly IRestaurantProfileRepository _restaurantRepository;
        private readonly IChatSessionRepository _chatSessionRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateRestaurantChatSessionHandler(
            IRestaurantProfileRepository restaurantRepository,
            IChatSessionRepository chatSessionRepository,
            IUnitOfWork unitOfWork)
        {
            _restaurantRepository = restaurantRepository;
            _chatSessionRepository = chatSessionRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(CreateRestaurantChatSessionCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            if (request.RestaurantId == Guid.Empty)
                return ApiResponse.Failure(400, "RestaurantId is required.");

            var restaurants = await _restaurantRepository.GetAsync(
                predicate: r => r.Id == request.RestaurantId,
                disableTracking: true);
            var restaurant = restaurants.FirstOrDefault();
            if (restaurant == null || restaurant.Status != RestaurantStatus.Active)
                return ApiResponse.Failure(404, "Nhà hàng không tồn tại hoặc đang tạm nghỉ.");

            // Tái sử dụng mọi session mở cùng khách–cửa hàng (kể cả đã gắn đơn)
            var existing = await _chatSessionRepository.GetAsync(
                predicate: s => s.UserId == request.CurrentUserId.Value
                    && s.RestaurantId == request.RestaurantId
                    && s.Status == ChatSessionStatus.Open,
                include: q => q.Include(s => s.Messages),
                disableTracking: true);

            var session = existing
                .OrderByDescending(s => s.Messages.Count > 0
                    ? s.Messages.Max(m => m.CreatedAt)
                    : s.CreatedAt)
                .FirstOrDefault();
            if (session != null)
                return ApiResponse.Success(MapSession(session), "Đã mở phiên chat với cửa hàng.");

            var newSession = new ChatSession
            {
                Id = Guid.NewGuid(),
                UserId = request.CurrentUserId.Value,
                RestaurantId = request.RestaurantId,
                OrderId = null,
                Topic = ChatTopic.General,
                Status = ChatSessionStatus.Open,
                CreatedAt = DateTime.UtcNow
            };

            _chatSessionRepository.Add(newSession);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(MapSession(newSession), "Đã tạo phiên chat với cửa hàng.");
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
