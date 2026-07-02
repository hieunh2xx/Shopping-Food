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
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class ResolveComplaintHandler : IRequestHandler<ResolveComplaintCommand, ApiResponse>
    {
        private readonly ISystemReportRepository _systemReportRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ResolveComplaintHandler(
            ISystemReportRepository systemReportRepository,
            IShipperProfileRepository shipperProfileRepository,
            IOrderRepository orderRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            INotificationRepository notificationRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _systemReportRepository = systemReportRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _orderRepository = orderRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _notificationRepository = notificationRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ResolveComplaintCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null ||
                (userProfile.Role != Domain.Enums.UserRole.Admin && userProfile.Role != Domain.Enums.UserRole.Coordinator))
                return ApiResponse.Failure(403, "Forbidden.");

            var reports = await _systemReportRepository.GetAsync(
                predicate: r => r.Id == request.ReportId
                            && (r.TargetType == Domain.Enums.ReportTargetType.Order ||
                                r.TargetType == Domain.Enums.ReportTargetType.Shipper),
                include: q => q.Include(r => r.Reporter).ThenInclude(p => p.UserAccount),
                disableTracking: false
                );
            var report = reports.FirstOrDefault();
            if (report == null)
                return ApiResponse.Failure(404, "Complaint not found.");

            if (report.Status != Domain.Enums.ReportStatus.Pending)
                return ApiResponse.Failure(400, "This complaint has already been processed.");

            if (report.TargetType == Domain.Enums.ReportTargetType.Order &&
                request.ResolutionType == "ShipperFault")
                return ApiResponse.Failure(400, "ShipperFault is not valid for order complaints. Use SellerFault or NoFault.");

            if (report.TargetType == Domain.Enums.ReportTargetType.Shipper &&
                request.ResolutionType == "SellerFault")
                return ApiResponse.Failure(400, "SellerFault is not valid for shipper complaints. Use ShipperFault or NoFault.");

            if (request.ResolutionType == "ShipperFault" && report.TargetId.HasValue)
                await ApplyShipperPenaltyAsync(report.TargetId.Value, request.PenaltyScore);

            if (request.ResolutionType == "SellerFault" && report.TargetId.HasValue)
                await NotifySellerAndAdminAsync(report.TargetId.Value, request.Notes);

            report.Status = ReportStatus.Resolved;
            report.Content = $"{report.Content}\n[Resolved by coordinator: {request.ResolutionType}. Note: {request.Notes}]";
            report.UpdatedAt = DateTime.UtcNow;
            _systemReportRepository.Update(report);

            NotifyReporter(report, request.ResolutionType, request.Notes);

            await _unitOfWork.SaveChangesAsync();
            return ApiResponse.Success(null, "Complaint resolved.");
        }

        private async Task ApplyShipperPenaltyAsync(Guid shipperProfileId, double penaltyScore)
        {
            var shippers = await _shipperProfileRepository.GetAsync(
                predicate: s => s.Id == shipperProfileId,
                include: q => q.Include(s => s.UserProfile).ThenInclude(p => p.UserAccount),
                disableTracking: false
                );
            var shipper = shippers.FirstOrDefault();
            if (shipper == null) return;

            shipper.ReputationScore = Math.Max(0, shipper.ReputationScore - penaltyScore);
            shipper.UpdatedAt = DateTime.UtcNow;
            _shipperProfileRepository.Update(shipper);

            _notificationRepository.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = shipper.UserProfile.UserAccountId,
                Title = "Bạn đã bị trừ điểm uy tín",
                Message = $"Khiếu nại về bạn đã được xác minh. Điểm uy tin của bạn đã bị trừ {penaltyScore} điểm.",
                NotificationType = NotificationType.System,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            });
        }

        private async Task NotifySellerAndAdminAsync(Guid orderId, string notes)
        {
            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == orderId,
                include: q => q.Include(o => o.Items)
                                    .ThenInclude(i => i.Product)
                                        .ThenInclude(p => p.Restaurant)
                                            .ThenInclude(r => r.Owner)
                                                .ThenInclude(up => up.UserAccount),
                disableTracking: true
                );
            var order = orders.FirstOrDefault();
            var sellerAccountId = order?.Items.FirstOrDefault()?.Product?.Restaurant?.Owner?.UserAccountId;

            if (sellerAccountId.HasValue)
            {
                _notificationRepository.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = sellerAccountId.Value,
                    Title = "Cảnh báo chất lượng đơn hàng",
                    Message = $"Khiếu nại về đơn hàng của bạn đã được xác minh. Vui lòng cải thiện chất lượng phục vụ. Ghi chú: {notes}",
                    NotificationType = NotificationType.System,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                });
            }

            var admins = await _userRepository.GetAsync(
                predicate: u => u.Profile != null && u.Profile.Role == UserRole.Admin,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );
            foreach (var admin in admins)
            {
                _notificationRepository.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = admin.Id,
                    Title = "Khiếu nại lỗi nhà hàng đã được xác nhận",
                    Message = $"Coordinator đã xác nhận khiếu nại đơn hàng là lỗi nhà hàng. Ghi chú: {notes}",
                    NotificationType = NotificationType.System,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                });
            }
        }

        private void NotifyReporter(SystemReport report, string resolutionType, string notes)
        {
            var reporterAccountId = report.Reporter?.UserAccount?.Id;
            if(!reporterAccountId.HasValue) return;

            var message = resolutionType == "NoFault"
                ? $"Khiếu nại của bạn dã được xem xét. Kết quả: Không xác nhận vi phạm. Ghi chú: {notes}"
                : $"Khiếu nại của bạn đã được xem xét và xác nhận. Kết quả: {resolutionType}. Ghi chú: {notes}";

            _notificationRepository.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = reporterAccountId.Value,
                Title = "Kết quả xử lý khiếu nại",
                Message = message,
                NotificationType = NotificationType.System,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            });
        }
    }
}
