using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Restaurants.Commands
{
    public class ToggleFavoriteRestaurantHandler : IRequestHandler<ToggleFavoriteRestaurantCommand, ApiResponse>
    {
        private readonly IFavoriteRestaurantRepository _favoriteRestaurantRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ToggleFavoriteRestaurantHandler(
            IFavoriteRestaurantRepository favoriteRestaurantRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _favoriteRestaurantRepository = favoriteRestaurantRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }
        public async Task<ApiResponse> Handle(ToggleFavoriteRestaurantCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var restaurant = await _restaurantProfileRepository.GetByIdAsync(request.RestaurantId);

                if (restaurant == null)
                    return ApiResponse.Failure(404, "Restaurant not found.");

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
                    f => f.UserProfileId == profileId && f.RestaurantId == request.RestaurantId
                    );

                return await ToggleFavoriteStatusAsync(favorites.FirstOrDefault(), profileId, request.RestaurantId);

            }
            catch (Exception ex) 
            {
                await _unitOfWork.LogErrorAsync("ToggleFavoriteRestaurantHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task<ApiResponse> ToggleFavoriteStatusAsync(FavoriteRestaurant? favorite, Guid profileId, Guid restaurantId)
        {
            if(favorite != null)
            {
                _favoriteRestaurantRepository.Delete(favorite);
                await _unitOfWork.SaveChangesAsync();
                return ApiResponse.Success(null, "Removed restaurant from favorites");
            }
            else
            {
                var newFavorite = new FavoriteRestaurant
                {
                    UserProfileId = profileId,
                    RestaurantId = restaurantId,
                    CreatedAt = DateTime.UtcNow
                };

                _favoriteRestaurantRepository.Add(newFavorite);
                await _unitOfWork.SaveChangesAsync();
                return ApiResponse.Success(null, "Added restaurant to favorites");
            }
        }
    }
}
