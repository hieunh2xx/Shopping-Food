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

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class BroadcastOrderToNearbyShippersHandler : IRequestHandler<BroadcastOrderToNearbyShippersCommand, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IOrderDispatchHistoryRepository _orderDispatchHistoryRepository;
        private readonly IUnitOfWork _unitOfWork;
        private const double EarthRadiusKm = 6371.0;

        public BroadcastOrderToNearbyShippersHandler(
            IOrderRepository orderRepository,
            IShipperProfileRepository shipperProfileRepository,
            IUserRepository userRepository,
            INotificationRepository notificationRepository,
            IOrderDispatchHistoryRepository orderDispatchHistoryRepository,
            IUnitOfWork unitOfWork)
        {
            _orderRepository = orderRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _userRepository = userRepository;
            _notificationRepository = notificationRepository;
            _orderDispatchHistoryRepository = orderDispatchHistoryRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(BroadcastOrderToNearbyShippersCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var coordinator = (await _userRepository.GetAsync(
                    predicate: u => u.Id == request.CurrentUserId.Value,
                    include: q => q.Include(u => u.Profile),
                    disableTracking: true
                )).FirstOrDefault();

                if (coordinator == null)
                    return ApiResponse.Failure(404, "User not found.");

                var orders = await _orderRepository.GetAsync(
                    predicate: o => o.Id == request.OrderId,
                    include: q => q.Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Restaurant),
                    disableTracking: false
                );
                
                var order = orders.FirstOrDefault();
                if (order == null)
                    return ApiResponse.Failure(404, "Order not found.");

                if (order.ShipperId.HasValue || order.Status != OrderStatus.WaitingForShipper)
                    return ApiResponse.Failure(400, "Order is not available for broadcast (might already be assigned or not in waiting status).");

                var firstItem = order.Items.FirstOrDefault();
                var restaurant = firstItem?.Product?.Restaurant;
                if (restaurant == null || !restaurant.Latitude.HasValue || !restaurant.Longitude.HasValue)
                    return ApiResponse.Failure(400, "Restaurant location is missing.");

                double restaurantLat = restaurant.Latitude.Value;
                double restaurantLon = restaurant.Longitude.Value;

                var onlineShippers = await _shipperProfileRepository.GetAsync(
                    predicate: s => s.IsOnline && s.Status == UserStatus.Active,
                    include: q => q.Include(s => s.UserProfile),
                    disableTracking: true
                );

                int broadcastCount = 0;
                foreach (var shipper in onlineShippers)
                {
                    if (!shipper.Latitude.HasValue || !shipper.Longitude.HasValue) continue;

                    double distance = CalculateHaversineDistance(restaurantLat, restaurantLon, shipper.Latitude.Value, shipper.Longitude.Value);
                    double maxRadius = shipper.OperatingRadiusKm.HasValue && shipper.OperatingRadiusKm.Value > 0 ? shipper.OperatingRadiusKm.Value : 5.0;

                    if (distance <= maxRadius)
                    {
                        var notification = new Notification
                        {
                            Id = Guid.NewGuid(),
                            UserId = shipper.UserProfile.UserAccountId,
                            Title = "Có đơn gần bạn",
                            Message = $"Có đơn #{Common.OrderDisplayHelper.ShortId(order.Id)} gần vị trí của bạn. Nhận đơn sớm để không bị người khác lấy trước!",
                            NotificationType = NotificationType.System,
                            TargetId = order.Id,
                            IsRead = false,
                            CreateAt = DateTime.UtcNow
                        };
                        _notificationRepository.Add(notification);
                        broadcastCount++;
                    }
                }

                if (broadcastCount > 0)
                {
                    var history = new OrderDispatchHistory
                    {
                        Id = Guid.NewGuid(),
                        OrderId = order.Id,
                        ActorId = coordinator.Id,
                        ActorName = coordinator.Profile.FullName,
                        ActorRole = "Coordinator",
                        ActionType = DispatchActionType.ManualAssigned, // You could add Broadcast enum if you want, but this is fine. Or just add a note.
                        TargetShipperId = null,
                        TargetShipperName = $"Broadcasted to {broadcastCount} shippers",
                        Note = "Gửi thông báo (Broadcast) đến tất cả tài xế gần đơn hàng.",
                        CreatedAt = DateTime.UtcNow
                    };
                    _orderDispatchHistoryRepository.Add(history);
                    
                    await _unitOfWork.SaveChangesAsync();
                    return ApiResponse.Success(null, $"Đã gửi thông báo đến {broadcastCount} tài xế thành công.");
                }

                return ApiResponse.Success(null, "Không có tài xế nào trực tuyến gần khu vực này.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("BroadcastOrderToNearbyShippersHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private double CalculateHaversineDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var dLat = DegreesToRadians(lat2 - lat1);
            var dLon = DegreesToRadians(lon2 - lon1);

            lat1 = DegreesToRadians(lat1);
            lat2 = DegreesToRadians(lat2);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2) * Math.Cos(lat1) * Math.Cos(lat2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return EarthRadiusKm * c;
        }

        private double DegreesToRadians(double degrees)
        {
            return degrees * Math.PI / 180.0;
        }
    }
}
