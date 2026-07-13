using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Restaurants.Commands
{
    public class UpdateRestaurantDeliveryConfigHandler : IRequestHandler<UpdateRestaurantDeliveryConfigCommand, ApiResponse>
    {
        private readonly IRestaurantProfileRepository _restaurantRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateRestaurantDeliveryConfigHandler(
            IRestaurantProfileRepository restaurantRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _restaurantRepository = restaurantRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(UpdateRestaurantDeliveryConfigCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var restaurant = await GetRestaurantByOwnerIdAsync(request.CurrentUserId.Value);
                if (restaurant == null)
                    return ApiResponse.Failure(404, "Restaurant profile not found.");

                restaurant.DeliveryType = request.DeliveryType;
                restaurant.MaxDeliveryRadiusKm = request.MaxDeliveryRadiusKm;
                restaurant.FreeDeliveryRadiusKm = request.FreeDeliveryRadiusKm;
                restaurant.FreeShippingMinimumOrder = request.FreeShippingMinimumOrder;
                restaurant.ShippingFee = request.ShippingFee;
                restaurant.UpdatedAt = DateTime.UtcNow;

                _restaurantRepository.Update(restaurant);
                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(null, "Delivery config updated successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("UpdateRestaurantDeliveryConfigHandler.Handle", ex);
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
    }
}
