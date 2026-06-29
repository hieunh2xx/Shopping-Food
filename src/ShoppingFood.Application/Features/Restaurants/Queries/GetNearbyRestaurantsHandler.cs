using AutoMapper;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Restaurant;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Restaurants.Queries
{
    public class GetNearbyRestaurantsHandler : IRequestHandler<GetNearbyRestaurantsQuery, ApiResponse>
    {
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IMapper _mapper;
        private const double EarthRadiusKm = 6371.0;
        public GetNearbyRestaurantsHandler(IRestaurantProfileRepository restaurantProfileRepository, IMapper mapper)
        {
            _restaurantProfileRepository = restaurantProfileRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetNearbyRestaurantsQuery request, CancellationToken cancellationToken)
        {
            var userLat = request.Latitude;
            var userLon = request.Longitude;
            var maxDist = request.RadiusInKm;

            var latDiff = maxDist / 111.0;
            var latMin = userLat - latDiff;
            var latMax = userLat + latDiff;

            var lonDiff = maxDist / (111.0 * Math.Cos(userLat * Math.PI / 180.0));
            var lonMin = userLon - lonDiff;
            var lonMax = userLon + lonDiff;

            var restaurant = await _restaurantProfileRepository.GetAsync(
                predicate: r => r.Status == Domain.Enums.RestaurantStatus.Active &&
                r.Latitude.HasValue && r.Longitude.HasValue &&
                r.Latitude.Value >= latMin && r.Latitude.Value <= latMax &&
                r.Longitude.Value >= lonMin && r.Longitude.Value <= lonMax,
                disableTracking: true
                );

            var resultList = new List<NearbyRestaurantDto>();
            foreach( var r in restaurant )
            {
                var distance = CalculateDistance(userLat, userLon, r.Latitude.Value, r.Longitude.Value);
                if(distance <= maxDist)
                {
                    var dto = _mapper.Map<NearbyRestaurantDto>(r);
                    dto.DistanceKm = Math.Round(distance, 2);
                    resultList.Add(dto);
                }
            }

            var finalResult = resultList
                .OrderBy(r => r.DistanceKm)
                .Skip(request.Skip)
                .Take(request.Take)
                .ToList();

            return ApiResponse.Success(finalResult, "Get nearby restaurants successfully.");
        }

        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var dLat = (lat2 - lat1) * Math.PI / 180.0;
            var dLon = (lon2 - lon1) * Math.PI / 180.0;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) *
                    Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180.0) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            var distance = EarthRadiusKm * c;
            return distance;
        }
    }
}
