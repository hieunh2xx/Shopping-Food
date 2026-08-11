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

namespace ShoppingFood.Application.Features.Shippers.Commands
{
    public class SubmitOrderExplanationHandler : IRequestHandler<SubmitOrderExplanationCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IOrderExplanationRequestRepository _explanationRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public SubmitOrderExplanationHandler(
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

        public async Task<ApiResponse> Handle(SubmitOrderExplanationCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            if (string.IsNullOrWhiteSpace(request.Reply))
                return ApiResponse.Failure(400, "Vui lòng nhập nội dung giải trình.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );
            var profile = users.FirstOrDefault()?.Profile;
            if (profile == null || profile.Role != UserRole.Shipper)
                return ApiResponse.Failure(403, "Forbidden.");

            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == request.OrderId && o.Shipper != null && o.Shipper.UserProfileId == profile.Id,
                include: q => q.Include(o => o.Shipper),
                disableTracking: true
            );
            var order = orders.FirstOrDefault();
            if (order == null)
                return ApiResponse.Failure(404, "Order not found or you are not the shipper.");

            var pendingList = await _explanationRepository.GetAsync(
                predicate: e => e.OrderId == order.Id && e.Status == ExplanationRequestStatus.Pending,
                include: q => q.Include(e => e.RequestedBy),
                disableTracking: false
            );
            var pending = pendingList.OrderByDescending(e => e.CreatedAt).FirstOrDefault();
            if (pending == null)
                return ApiResponse.Failure(400, "Không có yêu cầu giải trình đang chờ.");

            var reply = request.Reply.Trim();
            if (reply.Length > 2000) reply = reply[..2000];

            pending.ShipperReply = reply;
            pending.Status = ExplanationRequestStatus.Replied;
            pending.RepliedAt = DateTime.UtcNow;
            _explanationRepository.Update(pending);

            var shortId = order.Id.ToString()[..8].ToUpperInvariant();
            var requesterAccountId = pending.RequestedBy?.UserAccountId;
            if (requesterAccountId.HasValue)
            {
                var msg = $"Tài xế {profile.FullName} đã gửi giải trình cho đơn #{shortId}.";
                _notificationRepository.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = requesterAccountId.Value,
                    Title = $"Shipper đã giải trình đơn #{shortId}",
                    Message = msg,
                    NotificationType = NotificationType.System,
                    TargetId = order.Id,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                });
            }

            // Cũng báo Admin/Coordinator khác qua System (optional: all staff)
            var staffUsers = await _userRepository.GetAsync(
                predicate: u => u.Profile != null &&
                    (u.Profile.Role == UserRole.Coordinator || u.Profile.Role == UserRole.Admin)
                    && (!requesterAccountId.HasValue || u.Id != requesterAccountId.Value),
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );
            foreach (var staff in staffUsers.Take(20))
            {
                _notificationRepository.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = staff.Id,
                    Title = $"Shipper đã giải trình đơn #{shortId}",
                    Message = $"Tài xế {profile.FullName} đã gửi giải trình cho đơn #{shortId}.",
                    NotificationType = NotificationType.System,
                    TargetId = order.Id,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                });
            }

            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(new
            {
                pending.Id,
                pending.OrderId,
                Status = pending.Status.ToString(),
                pending.ShipperReply,
                pending.RepliedAt
            }, "Đã gửi giải trình.");
        }
    }
}
