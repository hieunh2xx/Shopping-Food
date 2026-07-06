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

namespace ShoppingFood.Application.Features.Shippers.Commands
{
    public class ReportOrderIncidentHandler : IRequestHandler<ReportOrderIncidentCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly ISystemReportRepository _systemReportRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ReportOrderIncidentHandler(
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

        public async Task<ApiResponse> Handle(ReportOrderIncidentCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null || userProfile.Role != UserRole.Shipper)
                return ApiResponse.Failure(403, "Forbidden. Only shippers can report order incidents.");

            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == request.OrderId && o.Shipper.UserProfileId == userProfile.Id,
                include: q => q.Include(o => o.Shipper),
                disableTracking: true
            );
            var order = orders.FirstOrDefault();
            if (order == null)
                return ApiResponse.Failure(404, "Order not found or you are not the shipper for this order.");

            if (order.Status != OrderStatus.Shipping && order.Status != OrderStatus.WaitingForShipper)
                return ApiResponse.Failure(400, "You can only report incidents for active orders.");

            var report = new SystemReport
            {
                Id = Guid.NewGuid(),
                ReporterId = userProfile.Id,
                TargetId = order.Id,
                TargetType = request.TargetType,
                Title = request.Title,
                Content = request.Content,
                Status = ReportStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _systemReportRepository.Add(report);
            
            // Notify Coordinators
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
                    Title = "Báo cáo sự cố từ Shipper",
                    Message = $"Shipper {userProfile.FullName} vừa báo cáo sự cố liên quan đến đơn hàng. Mã báo cáo: {report.Id}",
                    NotificationType = NotificationType.System,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                });
            }

            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(new { IncidentId = report.Id }, "Report submitted successfully.");
        }
    }
}
