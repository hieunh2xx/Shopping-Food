using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Support.Commands
{
    public class SubmitOrderComplaintHandler : IRequestHandler<SubmitOrderComplaintCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly ISystemReportRepository _systemReportRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public SubmitOrderComplaintHandler(
            IUserRepository userRepository,
            IOrderRepository orderRepository,
            ISystemReportRepository systemReportRepository,
            INotificationRepository notificationRepository,
            IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _orderRepository = orderRepository;
            _systemReportRepository = systemReportRepository;
            _notificationRepository = notificationRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(SubmitOrderComplaintCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            // Guard: chỉ Customer
            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null || userProfile.Role != UserRole.Customer)
                return ApiResponse.Failure(403, "Only customers can submit order complaints.");

            // Guard: order tồn tại
            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == request.OrderId,
                disableTracking: true
            );
            var order = orders.FirstOrDefault();
            if (order == null)
                return ApiResponse.Failure(404, "Order not found.");

            // Guard: đơn thuộc về user này
            if (order.UserAccountId != request.CurrentUserId.Value)
                return ApiResponse.Failure(403, "You can only submit complaints for your own orders.");

            // Guard: đơn đã giao thành công
            if (order.Status != OrderStatus.Delivered)
                return ApiResponse.Failure(400, "You can only submit a complaint for a delivered order.");

            // Guard: trong vòng 24h (BR43)
            if (DateTime.UtcNow > order.UpdatedAt.AddHours(24))
                return ApiResponse.Failure(400, "Complaint must be submitted within 24 hours after delivery. The deadline has passed.");

            // Guard: 1 đơn 1 khiếu nại (BR48)
            var alreadyComplained = await _systemReportRepository.ExistsAsync(
                r => r.TargetType == ReportTargetType.Order && r.TargetId == request.OrderId
            );
            if (alreadyComplained)
                return ApiResponse.Failure(400, "A complaint has already been submitted for this order.");

            var report = new SystemReport
            {
                Id = Guid.NewGuid(),
                ReporterId = userProfile.Id,                          // fix: dùng userProfile.Id
                TargetId = request.OrderId,
                TargetType = ReportTargetType.Order,
                Title = request.Reason,
                Content = string.IsNullOrEmpty(request.Description)
                    ? $"Bằng chứng: {request.EvidenceImageUrl}"
                    : $"{request.Description}\nBằng chứng: {request.EvidenceImageUrl}",
                Status = ReportStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _systemReportRepository.Add(report);

            await NotifyCoordinatorsAsync(request.OrderId);

            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(
                new { ComplaintId = report.Id },
                "Your complaint has been submitted successfully. Our team will review it within 24 hours."
            );
        }

        private async Task NotifyCoordinatorsAsync(Guid orderId)
        {
            var coordinators = await _userRepository.GetAsync(
                predicate: u => u.Profile != null && u.Profile.Role == UserRole.Coordinator,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );

            foreach (var coordinator in coordinators)
            {
                _notificationRepository.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = coordinator.Id,
                    Title = "Khiếu nại đơn hàng mới",
                    Message = $"Có khiếu nại mới về đơn #{Common.OrderDisplayHelper.ShortId(orderId)}. Vào mục Khiếu nại đơn hàng để xem nội dung và xử lý trong 24 giờ.",
                    NotificationType = NotificationType.Order,
                    TargetId = orderId,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                });
            }
        }
    }
}
