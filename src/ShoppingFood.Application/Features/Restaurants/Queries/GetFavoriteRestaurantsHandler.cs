using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
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
    public class GetFavoriteRestaurantsHandler : IRequestHandler<GetFavoriteRestaurantsQuery, ApiResponse>
    {
        private readonly IFavoriteRestaurantRepository _favoriteRestaurantRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public GetFavoriteRestaurantsHandler(
            IFavoriteRestaurantRepository favoriteRestaurantRepository,
            IUserRepository userRepository, IMapper mapper)
        {
            _favoriteRestaurantRepository = favoriteRestaurantRepository;
            _userRepository = userRepository;
            _mapper = mapper;
        }
        public async Task<ApiResponse> Handle(GetFavoriteRestaurantsQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");
                
            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile)
                );
            var user = users.FirstOrDefault();
            if (user?.Profile == null)
                return ApiResponse.Failure(404, "User profile not found");

            var profileId = user.Profile.Id;

            var favorites = await _favoriteRestaurantRepository.GetAsync(
                predicate: f => f.UserProfileId == profileId,
                include: q => q.Include(f => f.RestaurantProfile)
                               .ThenInclude(r => r.Owner),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
                );

            var total = await _favoriteRestaurantRepository.GetCountAsync(f => f.UserProfileId == profileId);

            var dto = _mapper.Map<List<FavoriteRestaurantDto>>(favorites);

            return ApiResponse.Success(dto, "Favorite restaurants retrieved successfully.", total);
        }
    }
}
