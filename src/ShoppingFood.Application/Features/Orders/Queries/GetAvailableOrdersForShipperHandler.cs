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
    public class GetAvailableOrdersForShipperHandler : IRequestHandler<GetAvailableOrdersForShipperQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly IOrderDeliveryProposalRepository _orderDeliveryProposalRepository;
        private readonly IMapper _mapper;
        private const double EarthRadiusKm = 6371.0;
        public GetAvailableOrdersForShipperHandler(
            IOrderRepository orderRepository,
            IShipperProfileRepository shipperProfileRepository,
            IUserRepository userRepository, 
            IOrderDeliveryProposalRepository orderDeliveryProposalRepository,
            IMapper mapper)
        {
            _orderRepository = orderRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _userRepository = userRepository;
            _orderDeliveryProposalRepository = orderDeliveryProposalRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetAvailableOrdersForShipperQuery request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var shipperProfile = await GetActiveShipperProfileAsync(request.CurrentUserId.Value);
                if (shipperProfile == null)
                    return ApiResponse.Failure(403, "Forbidden. Only active shippers can perform this action.");

                if (!shipperProfile.IsOnline)
                    return ApiResponse.Failure(400, "Shippers must switch to online status to perform this action");

                var excludeOrderIds = (await _orderDeliveryProposalRepository.GetAsync(
                    predicate: p => p.ShipperId == shipperProfile.Id &&
                                    (p.Status == ProposalStatus.Rejected || p.Status == ProposalStatus.Expired)
                    )).Select(p => p.OrderId).ToList();

                var orders = await _orderRepository.GetAsync(
                    predicate: o => o.Status == OrderStatus.WaitingForDriver &&
                               !o.ShipperId.HasValue &&
                               !excludeOrderIds.Contains(o.Id),
                    include: q => q.Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(r => r.Restaurant),
                    disableTracking: true
                    );

                var resultList = new List<ProposedDeliveryOfferDto>();

                shipperProfile.Latitude = request.Latitude;
                shipperProfile.Longitude = request.Longitude;
                shipperProfile.UpdatedAt = DateTime.UtcNow;
                _shipperProfileRepository.Update(shipperProfile);

                foreach(var order in orders)
                {
                    var firstItem = order.Items?.FirstOrDefault();
                    var restaurant = firstItem?.Product?.Restaurant;
                    if (restaurant == null) continue;

                    double distance = CalculateDistance(request.Latitude, request.Longitude, restaurant.Latitude ?? 0, restaurant.Longitude ?? 0);

                    double limitRadius = shipperProfile.OperatingRadiusKm.HasValue && shipperProfile.OperatingRadiusKm.Value > 0 ? shipperProfile.OperatingRadiusKm.Value : 5.0;

                    if (distance > limitRadius)
                        continue;

                    var dto = _mapper.Map<ProposedDeliveryOfferDto>(order);
                    dto.DistanceInKm = distance;

                    resultList.Add(dto);
                }

                resultList = resultList.OrderBy(o => o.DistanceInKm).ToList();

                return ApiResponse.Success(resultList, "Successfully retrieved available delivery orders.");
            }
            catch (Exception ex)
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
            if(userProfile == null || userProfile.Role != Domain.Enums.UserRole.Shipper)
                return null;

            var profiles = await _shipperProfileRepository.GetAsync(
                predicate: p => p.UserProfileId == userProfile.Id && p.Status == Domain.Enums.UserStatus.Active,
                include: q => q.Include(p => p.UserProfile),
                disableTracking: false
                );
            return profiles.FirstOrDefault();
        }

        private double CalculateDistance(double shipperLat, double shipperLon, double restaurantLat, double restaurantLon)
        {
            double shipperLatRad = shipperLat * (Math.PI / 180.0);
            double shipperLonRad = shipperLon * (Math.PI / 180.0);
            double restaurantLatRad = restaurantLat * (Math.PI / 180.0);
            double restaurantLonRad = restaurantLon * (Math.PI / 180.0);

            double distanceLat = restaurantLatRad - shipperLatRad;
            double distanceLon = restaurantLonRad - shipperLonRad;

            double haversineValue = Math.Pow(Math.Sin(distanceLat / 2.0), 2.0) +
                                    Math.Cos(shipperLatRad) * Math.Cos(restaurantLatRad) *
                                    Math.Pow(Math.Sin(distanceLon / 2.0), 2.0);

            double angularDistance = 2.0 * Math.Atan2(Math.Sqrt(haversineValue), Math.Sqrt(1.0 - haversineValue));

            double calculatedDistance = EarthRadiusKm * angularDistance;
            return Math.Round(calculatedDistance, 2);
        }
    }
}
