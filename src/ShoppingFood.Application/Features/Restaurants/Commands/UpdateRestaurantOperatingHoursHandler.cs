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
    public class UpdateRestaurantOperatingHoursHandler : IRequestHandler<UpdateRestaurantOperatingHoursCommand, ApiResponse>
    {
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateRestaurantOperatingHoursHandler(
            IRestaurantProfileRepository restaurantProfileRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _restaurantProfileRepository = restaurantProfileRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }
        public async Task<ApiResponse> Handle(UpdateRestaurantOperatingHoursCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                if (!TimeSpan.TryParse(request.OpeningTime, out var openingTime) ||
                   !TimeSpan.TryParse(request.ClosingTime, out var closingTime))
                    return ApiResponse.Failure(400, "Invalid time format. Use HH:mm.");

                var restaurant = await GetRestaurantByOwnerIdAsync(request.CurrentUserId.Value);
                if (restaurant == null)
                    return ApiResponse.Failure(404, "Restaurant profile not found.");

                UpdateRestaurantOperatingHours(restaurant, openingTime, closingTime);
                _restaurantProfileRepository.Update(restaurant);
                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(null, "Operatings hours updated successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("UpdateRestaurantOperatingHoursHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private void UpdateRestaurantOperatingHours(RestaurantProfile restaurant, TimeSpan openingTime, TimeSpan closingTime)
        {
            restaurant.OpeningTime = openingTime;
            restaurant.ClosingTime = closingTime;
            restaurant.UpdatedAt = DateTime.UtcNow;
        }

        private async Task<RestaurantProfile?> GetRestaurantByOwnerIdAsync(Guid userId)
        {
            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == userId,
                include: q => q.Include(u => u.Profile)
                );
            var userProfile = users.FirstOrDefault()?.Profile?.Id;
            if (userProfile == null)
                return null;

            var restaurants = await _restaurantProfileRepository.GetAsync(
                predicate: r => r.OwnerId == userProfile.Value,
                disableTracking: false
                );

            return restaurants.FirstOrDefault();
        }
    }
}
