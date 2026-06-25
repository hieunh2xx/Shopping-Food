using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Implementations;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class ConfirmPickedUpHandler : IRequestHandler<ConfirmPickedUpCommand, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ConfirmPickedUpHandler(
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
        public async Task<ApiResponse> Handle(ConfirmPickedUpCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var shipperProfile = await GetActiveShipperProfileAsync(request.CurrentUserId.Value);
                if (shipperProfile == null)
                    return ApiResponse.Failure(403, "Forbidden. Only active shippers can perform this action.");

                if (!shipperProfile.IsOnline)
                    return ApiResponse.Failure(400, "Drivers must switch to online status to perform this action.");

                var order = await GetOrderAsync(request.OrderId);
                if (order == null)
                    return ApiResponse.Failure(404, "Order not found.");

                if (order.ShipperId != shipperProfile.Id)
                    return ApiResponse.Failure(403, "Forbidden. You are not assigned to this order.");

                if (order.Status != OrderStatus.Shipping)
                    return ApiResponse.Failure(400, $"Invalid order status for picking up. Current status: {order.Status}");

                string orderIdString = order.Id.ToString();
                string expectedCode = orderIdString.Substring(orderIdString.Length - 6);

                if (!request.VerificationCode.Equals(expectedCode, StringComparison.OrdinalIgnoreCase))
                    return ApiResponse.Failure(400, "Invalid verification code. Please check the code with merchant.");

                shipperProfile.Latitude = request.Latitude;
                shipperProfile.Longitude = request.Longitude;
                shipperProfile.UpdatedAt = DateTime.UtcNow;
                _shipperProfileRepository.Update(shipperProfile);

                AddPickedUpNotification(order, shipperProfile.UserProfile.FullName);

                await _unitOfWork.SaveChangesAsync();
                return ApiResponse.Success(new {order.Id, Status = order.Status.ToString()}, "Food picked up successfully");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("ConfirmPickedUpHandler.Handle", ex);
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
                disableTracking: true
            );
            return orders.FirstOrDefault();
        }

        private void AddPickedUpNotification(Order order, string shipperName)
        {
            if (order.UserAccountId.HasValue)
            {
                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = order.UserAccountId.Value,
                    Title = "Đơn hàng đang trên đường giao",
                    Message = $"Tài xế '{shipperName}' đã lấy đồ ăn thành công và đang trên đường giao tới địa chỉ của bạn.",
                    NotificationType = NotificationType.Delivery,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow

                };
                _notificationRepository.Add(notification);
            }
        }
    }
}
