using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
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
        private readonly IPaymentSettlementService _paymentSettlementService;

        public ResolveComplaintHandler(
            ISystemReportRepository systemReportRepository,
            IShipperProfileRepository shipperProfileRepository,
            IOrderRepository orderRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            INotificationRepository notificationRepository,
            IShipperReputationHistoryRepository reputationHistoryRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork,
            IPaymentSettlementService paymentSettlementService)
        {
            _systemReportRepository = systemReportRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _orderRepository = orderRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _notificationRepository = notificationRepository;
            _reputationHistoryRepository = reputationHistoryRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _paymentSettlementService = paymentSettlementService;
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

            if (report.Status != Domain.Enums.ReportStatus.Pending && report.Status != Domain.Enums.ReportStatus.Escalated)
                return ApiResponse.Failure(400, "This complaint has already been processed.");

            if (report.TargetType == Domain.Enums.ReportTargetType.Shipper)
            {
                if (request.ResolutionType == Domain.Enums.ComplaintResolutionType.ShipperFault || request.ResolutionType == Domain.Enums.ComplaintResolutionType.Warning)
                {
                    await ApplyShipperPenaltyAsync(report.TargetId.Value, request.ResolutionType == Domain.Enums.ComplaintResolutionType.Warning ? 0 : request.PenaltyScore, request.ResolutionType, request.Notes);
                }
            }
            else if (report.TargetType == Domain.Enums.ReportTargetType.Order || report.TargetType == Domain.Enums.ReportTargetType.Restaurant)
            {
                if (request.ResolutionType == Domain.Enums.ComplaintResolutionType.CompensateCustomer)
                {
                    await ProcessOrderCompensationAsync(report.TargetId.Value, request.RefundAmount, request.DeductionAmount, request.ResponsibleParty);
                }
                
                if (request.ResolutionType == Domain.Enums.ComplaintResolutionType.SellerFault || request.ResolutionType == Domain.Enums.ComplaintResolutionType.Warning || request.ResolutionType == Domain.Enums.ComplaintResolutionType.CompensateCustomer)
                {
                    await NotifySellerAndAdminAsync(report.TargetId.Value, request.ResolutionType, request.Notes);
                }
                
                if (request.ResolutionType == Domain.Enums.ComplaintResolutionType.EscalateToAdmin)
                {
                    await NotifyAdminForEscalationAsync(report.Id, request.Notes);
                }
            }

            if (request.ResolutionType == Domain.Enums.ComplaintResolutionType.EscalateToAdmin)
            {
                report.Status = ReportStatus.Escalated;
            }
            else
            {
                report.Status = ReportStatus.Resolved;
            }
            
            string resolutionVi = TranslateResolutionType(request.ResolutionType);
            
            if (request.ResolutionType == Domain.Enums.ComplaintResolutionType.EscalateToAdmin)
            {
                report.Content = $"{report.Content}\n[Đã chuyển cho Admin. Ghi chú: {request.Notes?.Trim()}]";
            }
            else
            {
                report.Content = $"{report.Content}\n[Đã xử lý bởi Điều phối viên: {resolutionVi}. Ghi chú: {request.Notes?.Trim()}]";
            }
            report.UpdatedAt = DateTime.UtcNow;
            _systemReportRepository.Update(report);

            if (request.ResolutionType != Domain.Enums.ComplaintResolutionType.EscalateToAdmin)
            {
                NotifyReporter(report, request.ResolutionType, request.Notes);
            }

            try { await _unitOfWork.SaveChangesAsync(); } catch (global::System.Exception ex) { return ApiResponse.Failure(500, "Save Failed: " + (ex.InnerException?.Message ?? ex.Message)); }
            return ApiResponse.Success(null, request.ResolutionType == Domain.Enums.ComplaintResolutionType.EscalateToAdmin ? "Complaint escalated to Admin." : "Complaint resolved.");
        }

        private async Task ApplyShipperPenaltyAsync(Guid shipperProfileId, double penaltyScore, Domain.Enums.ComplaintResolutionType resolutionType, string notes)
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

            var title = resolutionType == Domain.Enums.ComplaintResolutionType.Warning ? "Cảnh cáo vi phạm" : "Bạn đã bị trừ điểm uy tín";
            var message = resolutionType == Domain.Enums.ComplaintResolutionType.Warning
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

        private async Task ProcessOrderCompensationAsync(Guid orderId, decimal refundAmount, decimal deductionAmount, string? responsibleParty)
        {
            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == orderId,
                include: q => q.Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Restaurant),
                disableTracking: false
            );
            var order = orders.FirstOrDefault();
            if (order == null || !order.UserAccountId.HasValue) return;

            var customerWallet = await _paymentSettlementService.GetOrCreateWalletAsync(WalletOwnerType.Customer, order.UserAccountId.Value);
            await _paymentSettlementService.RecordTransactionAsync(customerWallet, FinancialTransactionType.Refund, refundAmount,
                $"Hoàn bù khiếu nại đơn #{order.Id.ToString().Substring(0, 8)}", order.Id, "Order");

            if (responsibleParty == "Shipper" && order.ShipperId.HasValue && deductionAmount > 0)
            {
                var shippers = await _shipperProfileRepository.GetAsync(predicate: s => s.Id == order.ShipperId.Value, disableTracking: false);
                var shipper = shippers.FirstOrDefault();
                if (shipper != null)
                {
                    var shipperWallet = await _paymentSettlementService.GetOrCreateWalletAsync(WalletOwnerType.Shipper, shipper.Id);
                    await _paymentSettlementService.RecordTransactionAsync(shipperWallet, FinancialTransactionType.Adjustment, -deductionAmount,
                        $"Phạt khiếu nại đơn #{order.Id.ToString().Substring(0, 8)}", order.Id, "Order");
                    
                    shipper.WalletBalance -= deductionAmount;
                    shipper.UpdatedAt = DateTime.UtcNow;
                    _shipperProfileRepository.Update(shipper);
                }
            }
            else if (responsibleParty == "Restaurant" && deductionAmount > 0)
            {
                var restaurantId = order.Items.FirstOrDefault()?.Product?.RestaurantId;
                if (restaurantId.HasValue)
                {
                    var sellerWallet = await _paymentSettlementService.GetOrCreateWalletAsync(WalletOwnerType.Seller, restaurantId.Value);
                    await _paymentSettlementService.RecordTransactionAsync(sellerWallet, FinancialTransactionType.Adjustment, -deductionAmount,
                        $"Phạt khiếu nại đơn #{order.Id.ToString().Substring(0, 8)}", order.Id, "Order");
                }
            }
        }

        private async Task NotifySellerAndAdminAsync(Guid orderId, Domain.Enums.ComplaintResolutionType resolutionType, string notes)
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

            var title = resolutionType == Domain.Enums.ComplaintResolutionType.Warning ? "Cảnh cáo chất lượng phục vụ" : "Cảnh báo chất lượng đơn hàng (Có đền bù/Hủy)";
            var message = resolutionType == Domain.Enums.ComplaintResolutionType.Warning 
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

        private string TranslateResolutionType(Domain.Enums.ComplaintResolutionType resolutionType)
        {
            return resolutionType switch
            {
                Domain.Enums.ComplaintResolutionType.Warning => "Cảnh cáo",
                Domain.Enums.ComplaintResolutionType.ShipperFault => "Lỗi tài xế",
                Domain.Enums.ComplaintResolutionType.SellerFault => "Lỗi nhà hàng",
                Domain.Enums.ComplaintResolutionType.CustomerFault => "Lỗi khách hàng",
                Domain.Enums.ComplaintResolutionType.ForceCancelNoPenalty => "Hủy không phạt",
                Domain.Enums.ComplaintResolutionType.CompensateCustomer => "Đền bù khách hàng",
                Domain.Enums.ComplaintResolutionType.Dismiss => "Bỏ qua",
                Domain.Enums.ComplaintResolutionType.NoFault => "Không có lỗi",
                Domain.Enums.ComplaintResolutionType.EscalateToAdmin => "Chuyển Admin đền bù",
                _ => resolutionType.ToString()
            };
        }

        private async Task NotifyAdminForEscalationAsync(Guid reportId, string notes)
        {
            var admins = await _userRepository.GetAsync(
                predicate: u => u.Profile != null && u.Profile.Role == Domain.Enums.UserRole.Admin,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );
            foreach (var admin in admins)
            {
                _notificationRepository.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = admin.Id,
                    Title = "Có khiếu nại mới được chuyển từ Điều phối viên",
                    Message = $"Điều phối viên đã chuyển 1 khiếu nại đơn hàng cho bạn xử lý đền bù. Ghi chú: {notes}",
                    NotificationType = Domain.Enums.NotificationType.System,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                });
            }
        }

        private void NotifyReporter(SystemReport report, Domain.Enums.ComplaintResolutionType resolutionType, string notes)
        {
            var reporterAccountId = report.Reporter?.UserAccount?.Id;
            if(!reporterAccountId.HasValue) return;

            string vietnameseResolutionType = TranslateResolutionType(resolutionType);
            
            var message = (resolutionType == Domain.Enums.ComplaintResolutionType.NoFault || resolutionType == Domain.Enums.ComplaintResolutionType.Dismiss)
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
