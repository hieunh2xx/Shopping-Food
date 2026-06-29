using AutoMapper;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Restaurant;
using ShoppingFood.Repository.Interfaces;
using ShoppingFood.Domain.Enums;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetRestaurantsHandler : IRequestHandler<GetRestaurantsQuery, ApiResponse>
    {
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IMapper _mapper;

        public GetRestaurantsHandler(IRestaurantProfileRepository restaurantProfileRepository, IMapper mapper)
        {
            _restaurantProfileRepository = restaurantProfileRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetRestaurantsQuery request, CancellationToken cancellationToken)
        {
            var filterLower = request.Filter?.ToLower();

            var restaurants = await _restaurantProfileRepository.GetAsync(
                predicate: r => 
                    (string.IsNullOrEmpty(request.Status) || r.Status.ToString() == request.Status) &&
                    (string.IsNullOrEmpty(filterLower) || r.RestaurantName.ToLower().Contains(filterLower) || r.Email.ToLower().Contains(filterLower)),
                orderBy: q => q.OrderByDescending(r => r.CreatedAt),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
            );

            var total = await _restaurantProfileRepository.GetCountAsync(
                predicate: r => 
                    (string.IsNullOrEmpty(request.Status) || r.Status.ToString() == request.Status) &&
                    (string.IsNullOrEmpty(filterLower) || r.RestaurantName.ToLower().Contains(filterLower) || r.Email.ToLower().Contains(filterLower))
            );

            var dtos = _mapper.Map<IReadOnlyList<RestaurantProfileDto>>(restaurants);

            return ApiResponse.Success(dtos, "Restaurants retrieved successfully", total);
        }
    }
}
