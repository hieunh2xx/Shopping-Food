using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Common;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class ConfirmPickedUpBatchHandler : IRequestHandler<ConfirmPickedUpBatchCommand, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ConfirmPickedUpBatchHandler(
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

        public async Task<ApiResponse> Handle(ConfirmPickedUpBatchCommand request, CancellationToken cancellationToken)
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

                var requestedIds = request.OrderIds.Distinct().ToList();
                if (requestedIds.Count == 0)
                    return ApiResponse.Failure(400, "At least one order is required.");

                var requestedOrders = await GetOrdersWithRestaurantAsync(requestedIds);
                if (requestedOrders.Count != requestedIds.Count)
                    return ApiResponse.Failure(404, "One or more orders were not found.");

                foreach (var order in requestedOrders)
                {
                    if (order.ShipperId != shipperProfile.Id)
                        return ApiResponse.Failure(403, "Forbidden. You are not assigned to one or more of these orders.");

                    if (order.Status != OrderStatus.Shipping)
                        return ApiResponse.Failure(400, $"Invalid order status for picking up. Order {order.Id}: {order.Status}");
                }

                var restaurantIds = requestedOrders
                    .Select(GetRestaurantId)
                    .Where(id => id.HasValue)
                    .Select(id => id!.Value)
                    .Distinct()
                    .ToList();

                if (restaurantIds.Count != 1)
                    return ApiResponse.Failure(400, "All selected orders must belong to the same restaurant.");

                var restaurantId = restaurantIds[0];

                var eligibleOrders = await GetEligibleBatchOrdersAsync(shipperProfile.Id, restaurantId);
                var eligibleIds = eligibleOrders.Select(o => o.Id).ToHashSet();

                if (requestedIds.Any(id => !eligibleIds.Contains(id)))
                    return ApiResponse.Failure(400, "One or more selected orders are not eligible for batch pickup.");

                if (eligibleIds.Count < 2)
                    return ApiResponse.Failure(400, "Batch pickup requires at least 2 orders at the same restaurant. Use single pickup instead.");

                var expectedCode = BatchPickupCodeHelper.Compute(shipperProfile.Id, restaurantId, eligibleIds);
                if (!request.VerificationCode.Equals(expectedCode, StringComparison.OrdinalIgnoreCase))
                    return ApiResponse.Failure(400, "Invalid batch verification code. Please check the code with merchant.");

                shipperProfile.Latitude = request.Latitude;
                shipperProfile.Longitude = request.Longitude;
                shipperProfile.UpdatedAt = DateTime.UtcNow;
                _shipperProfileRepository.Update(shipperProfile);

                var shipperName = shipperProfile.UserProfile?.FullName ?? "Shipper";
                foreach (var order in requestedOrders)
                {
                    AddPickedUpNotification(order, shipperName);
                }

                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(
                    new
                    {
                        ConfirmedOrderIds = requestedIds,
                        RemainingEligibleCount = eligibleIds.Count - requestedIds.Count
                    },
                    $"Food picked up successfully for {requestedIds.Count} order(s).");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("ConfirmPickedUpBatchHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private static Guid? GetRestaurantId(Order order)
        {
            return order.Items?.FirstOrDefault()?.Product?.RestaurantId
                ?? order.Items?.FirstOrDefault()?.Product?.Restaurant?.Id;
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

        private async Task<List<Order>> GetOrdersWithRestaurantAsync(List<Guid> orderIds)
        {
            var orders = await _orderRepository.GetAsync(
                predicate: o => orderIds.Contains(o.Id),
                include: q => q.Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Restaurant),
                disableTracking: true
            );
            return orders.ToList();
        }

        private async Task<List<Order>> GetEligibleBatchOrdersAsync(Guid shipperProfileId, Guid restaurantId)
        {
            var orders = await _orderRepository.GetAsync(
                predicate: o =>
                    o.ShipperId == shipperProfileId &&
                    o.Status == OrderStatus.Shipping &&
                    o.Items.Any(i => i.Product != null && i.Product.RestaurantId == restaurantId),
                include: q => q.Include(o => o.Items).ThenInclude(i => i.Product),
                disableTracking: true
            );
            return orders.ToList();
        }

        private void AddPickedUpNotification(Order order, string shipperName)
        {
            if (!order.UserAccountId.HasValue) return;

            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = order.UserAccountId.Value,
                Title = "Đơn hàng đang trên đường giao",
                Message = $"Tài xế {shipperName} đã lấy món cho đơn #{Common.OrderDisplayHelper.ShortId(order.Id)} và đang giao tới địa chỉ của bạn. Theo dõi trong mục Đơn hàng.",
                NotificationType = NotificationType.Delivery,
                TargetId = order.Id,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            };
            _notificationRepository.Add(notification);
        }
    }
}
