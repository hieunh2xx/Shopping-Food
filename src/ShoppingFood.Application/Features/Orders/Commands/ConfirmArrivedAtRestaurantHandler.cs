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

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class ConfirmArrivedAtRestaurantHandler : IRequestHandler<ConfirmArrivedAtRestaurantCommand, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;
        private const double MaxAllowedDistance = 0.2;
        private const double EarthRadiusKm = 6371.0;
        public ConfirmArrivedAtRestaurantHandler(
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
        public async Task<ApiResponse> Handle(ConfirmArrivedAtRestaurantCommand request, CancellationToken cancellationToken)
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

                var order = await GetOrderWithDetailsAsync(request.OrderId);
                if (order == null)
                    return ApiResponse.Failure(404, "Order not found.");

                if (order.ShipperId != shipperProfile.Id)
                    return ApiResponse.Failure(403, "Forbidden. You are not assigned to this order.");

                if (order.Status != OrderStatus.Shipping)
                    return ApiResponse.Failure(400, $"Invalid order status for arrival confirmation. Current status: {order.Status}");

                var firstItem = order.Items?.FirstOrDefault();
                var restaurant = firstItem?.Product?.Restaurant;
                if (restaurant == null)
                    return ApiResponse.Failure(400, "Cannot determine restaurant information for this order");

                if (!restaurant.Latitude.HasValue || !restaurant.Longitude.HasValue)
                    return ApiResponse.Failure(400, "Cannot confirm arrival because the restaurant's GPS coordinates are not configured.");

                double distance = CalculateShipperToRestaurantDistance(request.Latitude, request.Longitude, restaurant.Latitude.Value, restaurant.Longitude.Value);
                if(distance > MaxAllowedDistance)
                {
                    double distanceInMeters = Math.Round(distance * 1000, 0);
                    return ApiResponse.Failure(400, $"You are too far from the restaurant to confirm arrival. Current distance: {distanceInMeters} meters (Max allowed: 200 meters).");
                }

                UpdateShipperCoordinates(shipperProfile, request.Latitude, request.Longitude);

                AddArrivalNotification(order, shipperProfile.UserProfile.FullName);

                await _unitOfWork.SaveChangesAsync();
                return ApiResponse.Success(new { order.Id, DistanceMeters = Math.Round(distance * 1000, 0) }, "Arrival at restaurant confirmed successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("ConfirmArrivedAtRestaurantHandler.Handle", ex);
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

        private async Task<Order?> GetOrderWithDetailsAsync(Guid orderId)
        {
            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == orderId,
                include: q => q.Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Restaurant),
                disableTracking: true
                );
            return orders.FirstOrDefault();
        }

        private double CalculateShipperToRestaurantDistance(double shipperLatitude, double shipperLongitude, double restaurantLatitude, double restaurantLongitude)
        {
            double shipperLatitudeRad = shipperLatitude * (Math.PI / 180.0);
            double shipperLongitudeRad = shipperLongitude * (Math.PI / 180.0);
            double restaurantLatitudeRad = restaurantLatitude * (Math.PI / 180.0);
            double restaurantLongitudeRad = restaurantLongitude * (Math.PI / 180.0);

            double distanceLat = restaurantLatitudeRad - shipperLatitudeRad;
            double distanceLon = restaurantLongitudeRad - shipperLongitudeRad;

            double haversineValue = Math.Pow(Math.Sin(distanceLat / 2.0), 2.0) +
                                    Math.Cos(shipperLatitudeRad) * Math.Cos(restaurantLatitudeRad) *
                                    Math.Pow(Math.Sin(distanceLon / 2.0), 2.0);

            double angularDistance = 2.0 * Math.Atan2(Math.Sqrt(haversineValue), Math.Sqrt(1.0 - haversineValue));

            double calculatedDistance = EarthRadiusKm * angularDistance;
            return Math.Round(calculatedDistance, 2);
        }

        private void UpdateShipperCoordinates(ShipperProfile shipper, double lat,  double lon)
        {
            shipper.Latitude = lat;
            shipper.Longitude = lon;
            shipper.UpdatedAt = DateTime.UtcNow;
            _shipperProfileRepository.Update(shipper);
        }

        private void AddArrivalNotification(Order order, string shipperName)
        {
            if (order.UserAccountId.HasValue)
            {
                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = order.UserAccountId.Value,
                    Title = "Tài xế đã đến cửa hàng",
                    Message = $"Tài xế {shipperName} đã đến và đang chờ nhận món cho đơn #{Common.OrderDisplayHelper.ShortId(order.Id)}. Vui lòng bàn giao đúng đơn (kiểm tra mã đơn trên túi).",
                    NotificationType = NotificationType.Delivery,
                    TargetId = order.Id,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow,
                };
                _notificationRepository.Add(notification);
            }
        }
    }
}
