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

namespace ShoppingFood.Application.Restaurants.Commands
{
    public class UpdateRestaurantDeliveryRadiusHandler : IRequestHandler<UpdateRestaurantDeliveryRadiusCommand, ApiResponse>
    {
        private readonly IRestaurantProfileRepository _restaurantRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        public UpdateRestaurantDeliveryRadiusHandler(
            IRestaurantProfileRepository restaurantRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _restaurantRepository = restaurantRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }
        public async Task<ApiResponse> Handle(UpdateRestaurantDeliveryRadiusCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var restarant = await GetRestaurantByOwnerIdAsync(request.CurrentUserId.Value);
                if (restarant == null)
                    return ApiResponse.Failure(404, "Restaurant profile not found.");

                UpdateDeliveryRadius(restarant, request.MaxDeliveryRadiusKm);

                _restaurantRepository.Update(restarant);
                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(null, "Delivery radius updated successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("UpdateRestaurantDeliveryRadiusHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
        private async Task<RestaurantProfile?> GetRestaurantByOwnerIdAsync(Guid userId)
        {
            var users = await _userRepository.GetAsync(u => u.Id == userId, include: q => q.Include(u => u.Profile));
            var userProfileId = users.FirstOrDefault()?.Profile?.Id;
            if (userProfileId == null) return null;
            var restaurants = await _restaurantRepository.GetAsync(r => r.OwnerId == userProfileId.Value, disableTracking: false);
            return restaurants.FirstOrDefault();
        }
        private void UpdateDeliveryRadius(RestaurantProfile restaurant, double radius)
        {
            restaurant.MaxDeliveryRadiusKm = radius;
            restaurant.UpdatedAt = DateTime.UtcNow;
        }
    }
}
