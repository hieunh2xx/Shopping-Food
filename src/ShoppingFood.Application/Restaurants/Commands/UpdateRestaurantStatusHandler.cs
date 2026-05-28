using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Restaurants.Commands
{
    public class UpdateRestaurantStatusHandler : IRequestHandler<UpdateRestaurantStatusCommand, ApiResponse>
    {
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateRestaurantStatusHandler(
            IRestaurantProfileRepository restaurantProfileRepository,
            IUserRepository userRepository, 
            IUnitOfWork unitOfWork) 
        {
            _restaurantProfileRepository = restaurantProfileRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }
        public async Task<ApiResponse> Handle(UpdateRestaurantStatusCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var restaurant = await GetRestaurantByOwnerIdAsync(request.CurrentUserId.Value);
                if (restaurant == null)
                    return ApiResponse.Failure(404, "Restaurant profile not found.");

                if (restaurant.Status == RestaurantStatus.Suspended)
                {
                    return ApiResponse.Failure(403, "Your restaurant has been suspended by Admin and cannot change status.");
                }

                UpdateStatus(restaurant, request.IsTemporarilyClosed);
                _restaurantProfileRepository.Update(restaurant);
                await _unitOfWork.SaveChangesAsync();

                string statusMessage = request.IsTemporarilyClosed ? "Restaurant status updated to Temporarily Closed." : "Restaurant status updated to Active.";
                return ApiResponse.Success(null, statusMessage);
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("UpdateRestaurantStatusHandler.Handle", ex);
                return ApiResponse.Failure(400, ex.Message);
            }
        }
        

        private void UpdateStatus(RestaurantProfile restaurant, bool isTemporarilyClosed)
        {
            restaurant.Status = isTemporarilyClosed ? RestaurantStatus.Inactive : RestaurantStatus.Active;
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
