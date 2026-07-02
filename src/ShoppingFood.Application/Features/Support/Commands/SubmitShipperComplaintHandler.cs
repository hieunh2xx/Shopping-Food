using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Support.Commands
{
    public class SubmitShipperComplaintHandler : IRequestHandler<SubmitShipperComplaintCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly ISystemReportRepository _systemReportRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public SubmitShipperComplaintHandler(
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

        public async Task<ApiResponse> Handle(SubmitShipperComplaintCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null || userProfile.Role != Domain.Enums.UserRole.Customer)
                return ApiResponse.Failure(403, "Forbidden.");

            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == request.OrderId,
                disableTracking: true
                );
            var order = orders.FirstOrDefault();
            if (order == null)
                return ApiResponse.Failure(404, "Order not found.");

            if (order.UserAccountId != request.CurrentUserId.Value)
                return ApiResponse.Failure(404, "You can only submit complaints for your own orders.");

            if (!order.ShipperId.HasValue)
                return ApiResponse.Failure(400, "This order has no assigned shipper.");

            if (order.Status != Domain.Enums.OrderStatus.Delivered)
                return ApiResponse.Failure(400, "Ypu can only submit a shipper complaint after the order hss been marked as delivered.");

            if (DateTime.UtcNow > order.UpdatedAt.AddHours(24))
                return ApiResponse.Failure(400, "Shipper complaint must be submitted within 24 hours. The deadline has passed.");

            var alreadyComplained = await _systemReportRepository.ExistsAsync(
                r => r.TargetType == Domain.Enums.ReportTargetType.Shipper &&
                    r.TargetId == order.ShipperId.Value &&
                    r.Content != null && r.Content.Contains(request.OrderId.ToString())
                );
            if (alreadyComplained)
                return ApiResponse.Failure(400, "A shipper complaint has already been submitted for this order.");

            var report = new SystemReport
            {
                Id = Guid.NewGuid(),
                ReporterId = userProfile.Id,
                TargetId = order.ShipperId.Value,
                TargetType = Domain.Enums.ReportTargetType.Shipper,
                Title = request.Reason,
                Content = string.IsNullOrEmpty(request.Description)
                    ? $"OrderId: {request.OrderId}\nBằng chứng: {request.EvidenceImageUrl}"
                    : $"{request.Description}\nOrderId: {request.OrderId}\nBằng chứng: {request.EvidenceImageUrl}",
                Status = Domain.Enums.ReportStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _systemReportRepository.Add(report);

            await NotifyCoodinatorAsync();
            await _unitOfWork.SaveChangesAsync();
            return ApiResponse.Success(new { ComplaintId = report.Id }, "Your shipper complaint has been submitted.");
        }

        private async Task NotifyCoodinatorAsync()
        {
            var coordinators = await _userRepository.GetAsync(
                predicate: u => u.Profile != null && u.Profile.Role == Domain.Enums.UserRole.Coordinator,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );
            foreach(var coordinator in coordinators)
            {
                _notificationRepository.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = coordinator.Id,
                    Title = "Khiếu nại tài xế không giao hàng",
                    Message = "Có khiếu nại mới về tài xế không giao hàng đang chờ điều tra.",
                    NotificationType = Domain.Enums.NotificationType.Delivery,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                });
            }
        }
    }
}
