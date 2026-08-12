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

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class ConfirmDeliveryFailedHandler : IRequestHandler<ConfirmDeliveryFailedCommand, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly ISystemReportRepository _systemReportRepository;
        private readonly IPaymentSettlementService _paymentSettlementService;
        private readonly IUnitOfWork _unitOfWork;

        public ConfirmDeliveryFailedHandler(
            IOrderRepository orderRepository,
            IShipperProfileRepository shipperProfileRepository,
            IUserRepository userRepository,
            INotificationRepository notificationRepository,
            ISystemReportRepository systemReportRepository,
            IPaymentSettlementService paymentSettlementService,
            IUnitOfWork unitOfWork)
        {
            _orderRepository = orderRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _userRepository = userRepository;
            _notificationRepository = notificationRepository;
            _systemReportRepository = systemReportRepository;
            _paymentSettlementService = paymentSettlementService;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ConfirmDeliveryFailedCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var shipperProfile = await GetActiveShipperProfileAsync(request.CurrentUserId.Value);
                if (shipperProfile == null)
                    return ApiResponse.Failure(403, "Forbidden. Only active shippers can perform this action.");

                if (!shipperProfile.IsOnline)
                    return ApiResponse.Failure(400, "Shippers must switch to online status to perform this action.");

                var order = await GetOrderAsync(request.OrderId);
                if (order == null)
                    return ApiResponse.Failure(404, "Order not found.");

                if (order.ShipperId != shipperProfile.Id)
                    return ApiResponse.Failure(403, "Forbidden. You are not assigned to this order.");

                if (order.Status != OrderStatus.Shipping)
                    return ApiResponse.Failure(400, $"Invalid order status for reporting failed delivery. Current status: {order.Status}");

                var reasonText = string.IsNullOrWhiteSpace(request.Reason) ? "Lý do khác" : request.Reason.Trim();
                if (reasonText.Length > 480)
                    reasonText = reasonText[..480];

                order.Status = OrderStatus.Cancelled;
                order.RejectReason = $"[Delivery Failed] {reasonText}";
                order.UpdatedAt = DateTime.UtcNow;
                _orderRepository.Update(order);

                await _paymentSettlementService.ProcessRefundAsync(order);

                shipperProfile.Latitude = request.Latitude;
                shipperProfile.Longitude = request.Longitude;
                shipperProfile.UpdatedAt = DateTime.UtcNow;
                _shipperProfileRepository.Update(shipperProfile);

                _systemReportRepository.Add(new SystemReport
                {
                    Id = Guid.NewGuid(),
                    ReporterId = shipperProfile.UserProfileId,
                    TargetId = order.Id,
                    TargetType = ReportTargetType.Order,
                    Title = reasonText.Length > 200 ? reasonText[..200] : reasonText,
                    Content = reasonText,
                    Status = ReportStatus.Pending,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

                AddFailedNotification(order, shipperProfile.UserProfile.FullName, reasonText);
                NotifyRestaurant(order, shipperProfile.UserProfile.FullName, reasonText);
                await NotifyStaffAsync(order, shipperProfile.UserProfile.FullName, reasonText);

                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(new { order.Id, Status = order.Status.ToString(), RejectReason = order.RejectReason }, "Failed delivery reported successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("ConfirmDeliveryFailedHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task<ShipperProfile?> GetActiveShipperProfileAsync(Guid userId)
        {
            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == userId,
                include: q => q.Include(u => u.Profile)
            );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null || userProfile.Role != UserRole.Shipper)
                return null;

            var profiles = await _shipperProfileRepository.GetAsync(
                predicate: p => p.UserProfileId == userProfile.Id && p.Status == UserStatus.Active,
                include: q => q.Include(p => p.UserProfile),
                disableTracking: false
            );
            return profiles.FirstOrDefault();
        }

        private async Task<Order?> GetOrderAsync(Guid orderId)
        {
            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == orderId,
                include: q => q.Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Restaurant).ThenInclude(r => r.Owner),
                disableTracking: false
            );
            return orders.FirstOrDefault();
        }

        private void AddFailedNotification(Order order, string shipperName, string reason)
        {
            if (order.UserAccountId.HasValue)
            {
                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = order.UserAccountId.Value,
                    Title = "Đơn hàng đã bị hủy",
                    Message = $"Đơn #{Common.OrderDisplayHelper.ShortId(order.Id)} đã bị hủy do giao không thành công. Bạn có thể xem chi tiết và trạng thái hoàn tiền (nếu có) trong mục Đơn hàng.",
                    NotificationType = NotificationType.Delivery,
                    TargetId = order.Id,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                };
                _notificationRepository.Add(notification);
            }
        }

        private void NotifyRestaurant(Order order, string shipperName, string reason)
        {
            var restaurant = order.Items?.FirstOrDefault()?.Product?.Restaurant;
            var ownerUserId = restaurant?.Owner?.UserAccountId;
            if (!ownerUserId.HasValue)
                return;

            var shortId = order.Id.ToString()[..8].ToUpperInvariant();
            _notificationRepository.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = ownerUserId.Value,
                Title = "Tài xế hủy giao đơn hàng",
                Message = $"Đơn #{shortId} đã bị tài xế {shipperName} báo giao thất bại / hủy. Lý do: {reason}. Kiểm tra đơn trong kênh người bán để xử lý tiếp.",
                NotificationType = NotificationType.Order,
                TargetId = order.Id,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            });
        }

        private async Task NotifyStaffAsync(Order order, string shipperName, string reason)
        {
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
                    Message = $"Tài xế {shipperName} báo giao thất bại và hủy đơn #{shortOrderId}. Lý do: {reason}. Vui lòng kiểm tra và hỗ trợ nếu cần.",
                    NotificationType = NotificationType.System,
                    TargetId = order.Id,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                });
            }
        }
    }
}
