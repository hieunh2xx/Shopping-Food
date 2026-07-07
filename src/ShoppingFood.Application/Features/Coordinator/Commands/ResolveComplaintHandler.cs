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
        private readonly IShipperReputationHistoryRepository _reputationHistoryRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ResolveComplaintHandler(
            ISystemReportRepository systemReportRepository,
            IShipperProfileRepository shipperProfileRepository,
            IOrderRepository orderRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            INotificationRepository notificationRepository,
            IShipperReputationHistoryRepository reputationHistoryRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _systemReportRepository = systemReportRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _orderRepository = orderRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _notificationRepository = notificationRepository;
            _reputationHistoryRepository = reputationHistoryRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ResolveComplaintCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");



            var reports = await _systemReportRepository.GetAsync(
                predicate: r => r.Id == request.ReportId,
                include: q => q.Include(r => r.Reporter).ThenInclude(p => p.UserAccount),
                disableTracking: false
                );
            var report = reports.FirstOrDefault();
            if (report == null)
                return ApiResponse.Failure(404, "Complaint not found.");

            if (report.Status != Domain.Enums.ReportStatus.Pending)
                return ApiResponse.Failure(400, "This complaint has already been processed.");

            if (report.TargetType == Domain.Enums.ReportTargetType.Shipper)
            {
                if (request.ResolutionType == "ShipperFault" || request.ResolutionType == "Warning")
                {
                    await ApplyShipperPenaltyAsync(report.TargetId.Value, request.ResolutionType == "Warning" ? 0 : request.PenaltyScore, request.ResolutionType, request.Notes);
                }
            }
            else if (report.TargetType == Domain.Enums.ReportTargetType.Order || report.TargetType == Domain.Enums.ReportTargetType.Restaurant)
            {
                if (request.ResolutionType == "SellerFault" || request.ResolutionType == "Warning" || request.ResolutionType == "CompensateCustomer")
                {
                    await NotifySellerAndAdminAsync(report.TargetId.Value, request.ResolutionType, request.Notes);
                }
            }

            report.Status = ReportStatus.Resolved;
            report.Content = $"{report.Content}\n[Resolved by coordinator: {request.ResolutionType}. Note: {request.Notes}]";
            report.UpdatedAt = DateTime.UtcNow;
            _systemReportRepository.Update(report);

            NotifyReporter(report, request.ResolutionType, request.Notes);

            await _unitOfWork.SaveChangesAsync();
            return ApiResponse.Success(null, "Complaint resolved.");
        }

        private async Task ApplyShipperPenaltyAsync(Guid shipperProfileId, double penaltyScore, string resolutionType, string notes)
        {
            var shippers = await _shipperProfileRepository.GetAsync(
                predicate: s => s.Id == shipperProfileId,
                include: q => q.Include(s => s.UserProfile).ThenInclude(p => p.UserAccount),
                disableTracking: false
                );
            var shipper = shippers.FirstOrDefault();
            if (shipper == null) return;

            var oldScore = shipper.ReputationScore;
            shipper.ReputationScore = Math.Max(0, shipper.ReputationScore - penaltyScore);
            shipper.UpdatedAt = DateTime.UtcNow;
            _shipperProfileRepository.Update(shipper);

            var actualChange = shipper.ReputationScore - oldScore;
            if (actualChange != 0)
            {
                var history = new ShipperReputationHistory
                {
                    Id = Guid.NewGuid(),
                    ShipperProfileId = shipper.Id,
                    PointChange = actualChange,
                    Reason = $"Khiếu nại về bạn đã được xác minh: {notes}",
                    CreatedAt = DateTime.UtcNow
                };
                _reputationHistoryRepository.Add(history);
            }

            var title = resolutionType == "Warning" ? "Cảnh cáo vi phạm" : "Bạn đã bị trừ điểm uy tín";
            var message = resolutionType == "Warning"
                ? $"Bạn nhận được một cảnh cáo từ hệ thống. Ghi chú: {notes}. Vui lòng chú ý thực hiện đúng quy định để không bị trừ điểm."
                : $"Khiếu nại về bạn đã được xác minh. Điểm uy tín của bạn đã bị trừ {penaltyScore} điểm. Ghi chú: {notes}";

            _notificationRepository.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = shipper.UserProfile.UserAccountId,
                Title = title,
                Message = message,
                NotificationType = NotificationType.System,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            });
        }

        private async Task NotifySellerAndAdminAsync(Guid orderId, string resolutionType, string notes)
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

            var title = resolutionType == "Warning" ? "Cảnh cáo chất lượng phục vụ" : "Cảnh báo chất lượng đơn hàng (Có đền bù/Hủy)";
            var message = resolutionType == "Warning" 
                ? $"Bạn nhận được một cảnh cáo từ hệ thống liên quan đến đơn hàng {order?.Id}. Vui lòng cải thiện chất lượng phục vụ. Ghi chú: {notes}"
                : $"Khiếu nại về đơn hàng của bạn đã được xác minh. Ghi chú: {notes}. Đơn hàng có thể bị hủy hoặc yêu cầu đền bù.";

            if (sellerAccountId.HasValue)
            {
                _notificationRepository.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = sellerAccountId.Value,
                    Title = title,
                    Message = message,
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
            string vietnameseResolutionType = TranslateResolutionType(resolutionType);
            foreach (var admin in admins)
            {
                _notificationRepository.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = admin.Id,
                    Title = $"Khiếu nại nhà hàng đã được xử lý ({vietnameseResolutionType})",
                    Message = $"Coordinator đã xử lý khiếu nại liên quan đến nhà hàng. Mức độ: {vietnameseResolutionType}. Ghi chú: {notes}",
                    NotificationType = NotificationType.System,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                });
            }
        }

        private string TranslateResolutionType(string resolutionType)
        {
            return resolutionType switch
            {
                "Warning" => "Cảnh cáo",
                "ShipperFault" => "Lỗi tài xế",
                "SellerFault" => "Lỗi nhà hàng",
                "CustomerFault" => "Lỗi khách hàng",
                "ForceCancelNoPenalty" => "Hủy không phạt",
                "CompensateCustomer" => "Đền bù khách hàng",
                "Dismiss" => "Bỏ qua",
                "NoFault" => "Không có lỗi",
                _ => resolutionType
            };
        }

        private void NotifyReporter(SystemReport report, string resolutionType, string notes)
        {
            var reporterAccountId = report.Reporter?.UserAccount?.Id;
            if(!reporterAccountId.HasValue) return;

            string vietnameseResolutionType = TranslateResolutionType(resolutionType);
            
            var message = (resolutionType == "NoFault" || resolutionType == "Dismiss")
                ? $"Khiếu nại của bạn dã được xem xét. Kết quả: Không xác nhận vi phạm ({vietnameseResolutionType}). Ghi chú: {notes}"
                : $"Khiếu nại của bạn đã được xem xét và xác nhận. Kết quả: {vietnameseResolutionType}. Ghi chú: {notes}";

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
