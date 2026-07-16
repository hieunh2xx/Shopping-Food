using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Dto.Coordinator;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Queries
{
    public class GetSuggestedShippersHandler : IRequestHandler<GetSuggestedShippersQuery, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IMapper _mapper;
        private const double EarthRadiusKm = 6371.0;
        public GetSuggestedShippersHandler(
            IUserRepository userRepository,
            IOrderRepository orderRepository,
            IShipperProfileRepository shipperProfileRepository,
            IMapper mapper)
        {
            _userRepository = userRepository;
            _orderRepository = orderRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetSuggestedShippersQuery request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");



                var orders = await _orderRepository.GetAsync(
                    predicate: o => o.Id == request.OrderId,
                    include: q => q.Include(o => o.Items)
                                        .ThenInclude(i => i.Product)
                                        .ThenInclude(r => r.Restaurant),
                    disableTracking: true
                    );
                var order = orders.FirstOrDefault();
                if (order == null)
                    return ApiResponse.Failure(404, "Order not found.");

                var firstItem = order.Items.FirstOrDefault();
                var restaurant = firstItem?.Product?.Restaurant;
                if (restaurant == null || !restaurant.Latitude.HasValue || !restaurant.Longitude.HasValue)
                    return ApiResponse.Failure(400, "Restaurant location coordinates are missing or invalid.");

                double restaurantLat = restaurant.Latitude.Value;
                double restaurantLon = restaurant.Longitude.Value;

                var activeOrders = await _orderRepository.GetAsync(
                    predicate: o => o.ShipperId.HasValue && (o.Status == Domain.Enums.OrderStatus.WaitingForShipper || o.Status == Domain.Enums.OrderStatus.Shipping),
                    disableTracking: true
                    );
                
                // Group active orders by ShipperId to count them
                var activeOrderCountByShipper = activeOrders
                    .GroupBy(o => o.ShipperId!.Value)
                    .ToDictionary(g => g.Key, g => g.Count());

                var onlineShippers = await _shipperProfileRepository.GetAsync(
                    predicate: s => s.IsOnline && s.Status == UserStatus.Active,
                    include: q => q.Include(s => s.UserProfile)
                                        .ThenInclude(u => u.UserAccount),
                    disableTracking: true
                    );

                var suggestedShipper = new List<SuggestedShipperDto>();
                foreach(var shipper in onlineShippers)
                {
                    if (!shipper.Latitude.HasValue || !shipper.Longitude.HasValue) continue;

                    double distance = CalculateHaversineDistance(restaurantLat, restaurantLon, shipper.Latitude.Value, shipper.Longitude.Value);

                    double maxRadius = shipper.OperatingRadiusKm.HasValue && shipper.OperatingRadiusKm.Value > 0 ? shipper.OperatingRadiusKm.Value : 5.0;

                    if (distance > maxRadius) continue;

                    var dto = _mapper.Map<SuggestedShipperDto>(shipper);
                    dto.DistanceInKm = distance;
                    dto.ActiveOrderCount = activeOrderCountByShipper.ContainsKey(shipper.Id) ? activeOrderCountByShipper[shipper.Id] : 0;
                    suggestedShipper.Add(dto);
                }

                var sortResult = suggestedShipper.OrderBy(s => s.DistanceInKm)
                                                 .ThenByDescending(s => s.ReputationScore)
                                                 .ToList();

                return ApiResponse.Success(sortResult, "Suggested shippers generated successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private double CalculateHaversineDistance(double lat1, double lon1, double lat2, double lon2)
        {
            double rlat1 = lat1 * (Math.PI / 180.0);
            double rlon1 = lon1 * (Math.PI / 180.0);
            double rlat2 = lat2 * (Math.PI / 180.0);
            double rlon2 = lon2 * (Math.PI / 180.0);
            double dLat = rlat2 - rlat1;
            double dLon = rlon2 - rlon1;
            double a = Math.Pow(Math.Sin(dLat / 2.0), 2.0) +
                       Math.Cos(rlat1) * Math.Cos(rlat2) *
                       Math.Pow(Math.Sin(dLon / 2.0), 2.0);
            double c = 2.0 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1.0 - a));
            double distance = EarthRadiusKm * c;
            return Math.Round(distance, 2);
        }
    }
}
