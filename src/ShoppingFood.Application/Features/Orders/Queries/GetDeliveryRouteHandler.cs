using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Order;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetDeliveryRouteHandler : IRequestHandler<GetDeliveryRouteQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IUserRepository _userReposiroty;
        private readonly IMapper _mapper;

        public GetDeliveryRouteHandler(
            IOrderRepository orderRepository, 
            IShipperProfileRepository shipperProfileRepository, 
            IUserRepository userRepository, 
            IMapper mapper)
        {
            _orderRepository = orderRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _userReposiroty = userRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetDeliveryRouteQuery request, CancellationToken cancellationToken)
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

                var order = await GetOrderWithDetailAsync(request.OrderId);
                if (order == null)
                    return ApiResponse.Failure(404, "Order not found.");

                if (order.ShipperId != shipperProfile.Id)
                    return ApiResponse.Failure(403, "Forbidden. You are not assignd to this order.");

                if (order.Status != OrderStatus.Shipping)
                    return ApiResponse.Failure(400, $"Delivery route is only available for shipping status. Current status: {order.Status}");

                var firstItem = order.Items?.FirstOrDefault();
                var restaurant = firstItem?.Product?.Restaurant;
                if (restaurant == null)
                    return ApiResponse.Failure(400, "Cannot determine restaurant information for this order.");

                if (!shipperProfile.Latitude.HasValue || !shipperProfile.Longitude.HasValue)
                    return ApiResponse.Failure(400, "Cannot construct route because your current GPS coordinates are not set. Please update location first.");

                if (!restaurant.Latitude.HasValue || !restaurant.Longitude.HasValue)
                    return ApiResponse.Failure(400, "Cannot construct route because the restaurant's GPS coordinates are not configured.");

                if(!order.DeliveryLatitude.HasValue || !order.DeliveryLongitude.HasValue)
                    return ApiResponse.Failure(400, "Cannot construct route because the customer's delivery coordinates are not set.");

                string googleMapsUrl = BuildGoogleMapsNavigationUrl(
                    shipperProfile.Latitude.Value,
                    shipperProfile.Longitude.Value,
                    restaurant.Latitude.Value,
                    restaurant.Longitude.Value,
                    order.DeliveryLatitude.Value,
                    order.DeliveryLongitude.Value
                    );

                var dto = _mapper.Map<DeliveryRouteDto>(order);
                dto.ShipperLatitude = shipperProfile.Latitude;
                dto.ShipperLongitude = shipperProfile.Longitude;
                dto.GoogleMapNavigationUrl = googleMapsUrl;
                return ApiResponse.Success(dto, "Successfully retrieved the delivery route details.");
            }
            catch (Exception ex)
            {
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task<ShipperProfile?> GetActiveShipperProfileAsync(Guid userId)
        {
            var users = await _userReposiroty.GetAsync(
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

        private async Task<Order?> GetOrderWithDetailAsync(Guid orderId)
        {
            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == orderId,
                include: q => q.Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Restaurant),
                disableTracking: true
                );
            return orders.FirstOrDefault();
        }

        private string BuildGoogleMapsNavigationUrl(double shipperLat, double shipperLon, double restLat, double restLon, double customerLat, double customerLon)
        {
            string origin = string.Format(CultureInfo.InvariantCulture, "{0},{1}", shipperLat, shipperLon);
            string destination = string.Format(CultureInfo.InvariantCulture, "{0},{1}", customerLat, customerLon);
            string waypoint = string.Format(CultureInfo.InvariantCulture, "{0},{1}", restLat, restLon);

            return $"https://www.google.com/maps/dir/?api=1&origin={origin}&destination={destination}&waypoints={waypoint}&travelmode=driving";
        }
    }
}
