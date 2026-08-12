using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
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
        private readonly IPaymentSettlementService _paymentSettlementService;
        private readonly IUnitOfWork _unitOfWork;

        public ReportOrderIncidentHandler(
            IUserRepository userRepository,
            IOrderRepository orderRepository,
            ISystemReportRepository systemReportRepository,
            INotificationRepository notificationRepository,
            IPaymentSettlementService paymentSettlementService,
            IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _orderRepository = orderRepository;
            _systemReportRepository = systemReportRepository;
            _notificationRepository = notificationRepository;
            _paymentSettlementService = paymentSettlementService;
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
                include: q => q
                    .Include(o => o.Shipper)
                    .Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p!.Restaurant).ThenInclude(r => r.Owner),
                disableTracking: false
            );
            var order = orders.FirstOrDefault();
            if (order == null)
                return ApiResponse.Failure(404, "Order not found or you are not the shipper for this order.");

            if (order.Status != OrderStatus.Shipping && order.Status != OrderStatus.WaitingForShipper)
                return ApiResponse.Failure(400, "You can only report incidents for active orders.");

            var reasonText = string.IsNullOrWhiteSpace(request.Content)
                ? request.Title
                : $"{request.Title}: {request.Content}".Trim();
            if (reasonText.Length > 480)
                reasonText = reasonText[..480];

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

            // Hủy đơn + lưu lý do để nhà hàng / khách xem trong chi tiết đơn
            order.Status = OrderStatus.Cancelled;
            order.RejectReason = $"[Delivery Failed] {reasonText}";
            order.UpdatedAt = DateTime.UtcNow;
            _orderRepository.Update(order);

            await _paymentSettlementService.ProcessRefundAsync(order);

            NotifyCustomer(order, userProfile.FullName, reasonText);
            NotifyRestaurant(order, userProfile.FullName, reasonText);

            var staffUsers = await _userRepository.GetAsync(
                predicate: u => u.Profile != null &&
                    (u.Profile.Role == UserRole.Coordinator || u.Profile.Role == UserRole.Admin),
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );

            var shortOrderId = order.Id.ToString()[..8].ToUpperInvariant();
            foreach (var staff in staffUsers)
            {
                _notificationRepository.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = staff.Id,
                    Title = "Báo cáo sự cố từ tài xế",
                    Message = $"Tài xế {userProfile.FullName} báo sự cố và hủy đơn #{shortOrderId}. Lý do: {reasonText}. Vui lòng kiểm tra và hỗ trợ nếu cần.",
                    NotificationType = NotificationType.System,
                    TargetId = order.Id,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                });
            }

            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(
                new { IncidentId = report.Id, Status = order.Status.ToString(), RejectReason = order.RejectReason },
                "Đã hủy đơn và gửi báo cáo sự cố.");
        }

        private void NotifyCustomer(Order order, string shipperName, string reason)
        {
            if (!order.UserAccountId.HasValue) return;
            _notificationRepository.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = order.UserAccountId.Value,
                Title = "Đơn hàng đã bị hủy",
                Message = $"Đơn #{Common.OrderDisplayHelper.ShortId(order.Id)} đã bị hủy do sự cố giao hàng. Bạn có thể xem chi tiết và trạng thái hoàn tiền (nếu có) trong mục Đơn hàng.",
                NotificationType = NotificationType.Delivery,
                TargetId = order.Id,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            });
        }

        private void NotifyRestaurant(Order order, string shipperName, string reason)
        {
            var restaurant = order.Items?.FirstOrDefault()?.Product?.Restaurant;
            var ownerUserId = restaurant?.Owner?.UserAccountId;
            if (!ownerUserId.HasValue) return;

            var shortId = order.Id.ToString()[..8].ToUpperInvariant();
            _notificationRepository.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = ownerUserId.Value,
                Title = "Tài xế hủy giao đơn hàng",
                Message = $"Đơn #{shortId} đã bị tài xế {shipperName} báo sự cố / hủy. Lý do: {reason}. Kiểm tra đơn trong kênh người bán để xử lý tiếp.",
                NotificationType = NotificationType.Order,
                TargetId = order.Id,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            });
        }
    }
}
