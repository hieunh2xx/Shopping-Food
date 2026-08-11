using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Order;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetProposedDeliveryOfferHandler : IRequestHandler<GetProposedDeliveryOfferQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public GetProposedDeliveryOfferHandler(
            IOrderRepository orderRepository,
            IShipperProfileRepository shipperProfileRepository,
            IUserRepository userRepository, 
            IMapper mapper) 
        {
            _orderRepository = orderRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _userRepository = userRepository;
            _mapper = mapper;
        }
        public async Task<ApiResponse> Handle(GetProposedDeliveryOfferQuery request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var shipperProfile = await GetActiveShipperProfileAsync(request.CurrentUserId.Value);
                if (shipperProfile == null)
                    return ApiResponse.Failure(403, "Forbidden. Only active shippers can view delivery proposals.");

                if (!shipperProfile.IsOnline)
                    return ApiResponse.Failure(400, "Shippers must switch to online status to view proposals.");

                var order = await GetOrderWithDetailsAsync(request.OrderId);
                if (order == null)
                    return ApiResponse.Failure(404, "Order not found.");

                if (order.ShipperId.HasValue && order.ShipperId != shipperProfile.Id)
                    return ApiResponse.Failure(400, "This order has already been accepted by another driver.");

                if (order.Status != OrderStatus.WaitingForShipper && order.Status != OrderStatus.Shipping)
                    return ApiResponse.Failure(400, $"The order is not in waiting for shipper status. Current status: {order.Status}.");

                var firstItem = order.Items?.FirstOrDefault();
                var restaurant = firstItem?.Product?.Restaurant;
                if (restaurant == null)
                    return ApiResponse.Failure(400, "Cannot determine restaurant information for this order.");

                shipperProfile.Latitude = request.Latitude;
                shipperProfile.Longitude = request.Longitude;
                shipperProfile.UpdatedAt = DateTime.UtcNow;
                _shipperProfileRepository.Update(shipperProfile);

                double distance = CalculateDistanceBetweenShipperAndRestaurant(shipperProfile, restaurant);
                double? deliveryDistance = CalculateDeliveryDistance(restaurant, order);
                // Fallback: suy ra quãng đường giao từ phí km đã lưu (công thức checkout: max(0, km - 5) * feePerKm)
                if (!deliveryDistance.HasValue && order.ShipperDistanceFeeAmount > 0)
                {
                    const decimal defaultFeePerKm = 4000m;
                    var feePerKm = defaultFeePerKm;
                    deliveryDistance = Math.Round(5.0 + (double)(order.ShipperDistanceFeeAmount / feePerKm), 2);
                }

                var dto = _mapper.Map<ProposedDeliveryOfferDto>(order);
                dto.DistanceInKm = distance;
                dto.DeliveryDistanceInKm = deliveryDistance;
                dto.TotalIncome = order.ShipperIncome;
                dto.BaseFee = order.ShipperBaseFeeAmount;
                dto.DistanceFee = order.ShipperDistanceFeeAmount;
                dto.PeakBonus = order.ShipperPeakBonus;

                return ApiResponse.Success(dto, "Successfully retrieved the proposed delivery order details.");
            }
            catch(Exception ex)
            {
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
                disableTracking: true
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

        private const double EarthRadiusKm = 6371.0;
        private const double DefaultDistanceKm = 2.5;
        private double CalculateDistanceBetweenShipperAndRestaurant(ShipperProfile shipper, RestaurantProfile restaurant)
        {
            if (!shipper.Latitude.HasValue || !shipper.Longitude.HasValue || !restaurant.Latitude.HasValue || !restaurant.Longitude.HasValue)
                return DefaultDistanceKm;

            return HaversineKm(
                shipper.Latitude.Value, shipper.Longitude.Value,
                restaurant.Latitude.Value, restaurant.Longitude.Value);
        }

        private double? CalculateDeliveryDistance(RestaurantProfile restaurant, Order order)
        {
            if (!restaurant.Latitude.HasValue || !restaurant.Longitude.HasValue
                || !order.DeliveryLatitude.HasValue || !order.DeliveryLongitude.HasValue)
                return null;

            return HaversineKm(
                restaurant.Latitude.Value, restaurant.Longitude.Value,
                order.DeliveryLatitude.Value, order.DeliveryLongitude.Value);
        }

        private static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
        {
            var lat1Rad = lat1 * (Math.PI / 180.0);
            var lon1Rad = lon1 * (Math.PI / 180.0);
            var lat2Rad = lat2 * (Math.PI / 180.0);
            var lon2Rad = lon2 * (Math.PI / 180.0);

            double dLat = lat2Rad - lat1Rad;
            double dLon = lon2Rad - lon1Rad;

            double haversineValue = Math.Pow(Math.Sin(dLat / 2.0), 2.0) +
                                     Math.Cos(lat1Rad) * Math.Cos(lat2Rad) *
                                     Math.Pow(Math.Sin(dLon / 2.0), 2.0);

            double angularDistance = 2.0 * Math.Atan2(Math.Sqrt(haversineValue), Math.Sqrt(1.0 - haversineValue));
            return Math.Round(EarthRadiusKm * angularDistance, 2);
        }
    }
}
