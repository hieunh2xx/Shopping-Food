using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class RequestOrderExplanationHandler : IRequestHandler<RequestOrderExplanationCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IOrderExplanationRequestRepository _explanationRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public RequestOrderExplanationHandler(
            IUserRepository userRepository,
            IOrderRepository orderRepository,
            IOrderExplanationRequestRepository explanationRepository,
            INotificationRepository notificationRepository,
            IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _orderRepository = orderRepository;
            _explanationRepository = explanationRepository;
            _notificationRepository = notificationRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(RequestOrderExplanationCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            if (string.IsNullOrWhiteSpace(request.Message))
                return ApiResponse.Failure(400, "Vui lòng nhập nội dung yêu cầu giải trình.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );
            var profile = users.FirstOrDefault()?.Profile;
            if (profile == null || (profile.Role != UserRole.Coordinator && profile.Role != UserRole.Admin))
                return ApiResponse.Failure(403, "Forbidden.");

            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == request.OrderId,
                include: q => q.Include(o => o.Shipper).ThenInclude(s => s!.UserProfile),
                disableTracking: true
            );
            var order = orders.FirstOrDefault();
            if (order == null)
                return ApiResponse.Failure(404, "Order not found.");

            if (order.Status != OrderStatus.Cancelled
                || string.IsNullOrWhiteSpace(order.RejectReason)
                || !order.RejectReason.StartsWith("[Delivery Failed]", StringComparison.OrdinalIgnoreCase))
            {
                return ApiResponse.Failure(400, "Chỉ yêu cầu giải trình cho đơn hủy do sự cố giao hàng.");
            }

            if (order.Shipper?.UserProfile == null)
                return ApiResponse.Failure(400, "Đơn không có tài xế để yêu cầu giải trình.");

            var pending = await _explanationRepository.GetAsync(
                predicate: e => e.OrderId == order.Id && e.Status == ExplanationRequestStatus.Pending,
                disableTracking: true
            );
            if (pending.Any())
                return ApiResponse.Failure(400, "Đã có yêu cầu giải trình đang chờ tài xế trả lời.");

            var message = request.Message.Trim();
            if (message.Length > 1000) message = message[..1000];

            var entity = new OrderExplanationRequest
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                RequestedByProfileId = profile.Id,
                RequestMessage = message,
                Status = ExplanationRequestStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };
            _explanationRepository.Add(entity);

            var shortId = order.Id.ToString()[..8].ToUpperInvariant();
            var shipperUserId = order.Shipper.UserProfile.UserAccountId;
            var notifyMsg = $"Điều phối yêu cầu giải trình cho đơn #{shortId}. Nội dung: {message}";
            if (notifyMsg.Length > 500) notifyMsg = notifyMsg[..497] + "...";

            _notificationRepository.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = shipperUserId,
                Title = $"Yêu cầu giải trình đơn #{shortId}",
                Message = notifyMsg,
                NotificationType = NotificationType.System,
                TargetId = order.Id,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            });

            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(new
            {
                entity.Id,
                entity.OrderId,
                entity.Status,
                entity.RequestMessage,
                entity.CreatedAt
            }, "Đã gửi yêu cầu giải trình tới tài xế.");
        }
    }
}
