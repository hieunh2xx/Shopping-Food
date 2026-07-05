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
    public class CreateSupportTicketHandler : IRequestHandler<CreateSupportTicketCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly ISystemReportRepository _systemReportRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateSupportTicketHandler(
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

        public async Task<ApiResponse> Handle(CreateSupportTicketCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null || userProfile.Role != Domain.Enums.UserRole.Admin)
                return ApiResponse.Failure(403, "Forbidden.");

            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == request.OrderId,
                disableTracking: true
                );
            var order = orders.FirstOrDefault();
            if (order == null)
                return ApiResponse.Failure(404, "Order not found.");

            if (request.CustomerId.HasValue)
            {
                var customerExists = await _userRepository.ExistsAsync(u => u.Id == request.CustomerId.Value);
                if (!customerExists)
                    return ApiResponse.Failure(404, "Customer not found.");
            }

            var alreadyExists = await _systemReportRepository.ExistsAsync(
                r => r.TargetType == Domain.Enums.ReportTargetType.Order && r.TargetId == request.OrderId
                );
            if (alreadyExists)
                return ApiResponse.Failure(400, "A support ticket already exists for this order.");

            var content = BuildContent(request);

            var report = new SystemReport
            {
                Id = Guid.NewGuid(),
                ReporterId = userProfile.Id,
                TargetType = Domain.Enums.ReportTargetType.Order,
                Title = request.Reason,
                Content = content,
                Status = Domain.Enums.ReportStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _systemReportRepository.Add(report );

            await NotifyCoordinatorsAsync();
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(new { TicketId = report.Id }, "Support ticket created successfully.");
        }

        private async Task NotifyCoordinatorsAsync()
        {
            var coordinators = await _userRepository.GetAsync(
                predicate: u => u.Profile != null && u.Profile.Role == Domain.Enums.UserRole.Coordinator,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );

            foreach (var coordinator in coordinators)
            {
                _notificationRepository.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = coordinator.Id,
                    Title = "Ticket hỗ trợ mới từ CSKH",
                    Message = "Nhân viên CSKH vừa tiếp nhận và mở ticket hỗ trợ mới. Vui lòng xử lý.",
                    NotificationType = Domain.Enums.NotificationType.Order,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow,
                });
            }
        }

        private string BuildContent(CreateSupportTicketCommand request)
        {
            var parts = new List<string>();

            if(!string.IsNullOrEmpty(request.Description))
                parts.Add(request.Description);

            if (request.CustomerId.HasValue)
                parts.Add($"CustomerId: {request.CustomerId}");

            if (!string.IsNullOrEmpty(request.EvidenceImageUrl))
                parts.Add($"Bằng chứng: {request.EvidenceImageUrl}");

            parts.Add("[Ticket tạo bởi Admin]");

            return string.Join("\n", parts);
        }
    }
}
