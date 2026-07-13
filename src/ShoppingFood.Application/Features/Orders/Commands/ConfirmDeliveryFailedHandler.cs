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

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class ConfirmDeliveryFailedHandler : IRequestHandler<ConfirmDeliveryFailedCommand, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ConfirmDeliveryFailedHandler(
            IOrderRepository orderRepository,
            IShipperProfileRepository shipperProfileRepository,
            IUserRepository userRepository,
            INotificationRepository notificationRepository,
            IUnitOfWork unitOfWork)
        {
            _orderRepository = orderRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _userRepository = userRepository;
            _notificationRepository = notificationRepository;
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

                order.Status = OrderStatus.Cancelled;
                order.RejectReason = $"[Delivery Failed] {request.Reason}";
                order.UpdatedAt = DateTime.UtcNow;
                _orderRepository.Update(order);

                shipperProfile.Latitude = request.Latitude;
                shipperProfile.Longitude = request.Longitude;
                shipperProfile.UpdatedAt = DateTime.UtcNow;
                _shipperProfileRepository.Update(shipperProfile);

                AddFailedNotification(order, shipperProfile.UserProfile.FullName, request.Reason);

                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(new { order.Id, Status = order.Status.ToString() }, "Failed delivery reported successfully.");
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
                    Title = "Giao hàng không thành công",
                    Message = $"Đơn hàng của bạn không được giao thành công bởi tài xế '{shipperName}'. Lý do: {reason}.",
                    NotificationType = NotificationType.Delivery,
                    TargetId = order.Id,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                };
                _notificationRepository.Add(notification);
            }
        }
    }
}
