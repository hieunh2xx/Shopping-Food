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
    public class UpdateRestaurantShippingFeeHandler : IRequestHandler<UpdateRestaurantShippingFeeCommand, ApiResponse>
    {
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateRestaurantShippingFeeHandler(
            IRestaurantProfileRepository restaurantProfileRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _restaurantProfileRepository = restaurantProfileRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }
        public async Task<ApiResponse> Handle(UpdateRestaurantShippingFeeCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var restaurant = await GetRestaurantByOwnerIdAsync(request.CurrentUserId.Value);
                if (restaurant == null)
                    return ApiResponse.Failure(404, "Restaurant profile not found");

                UpdateShippingFee(restaurant, request.ShippingFee);
                _restaurantProfileRepository.Update(restaurant);
                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(null, "Shipping fee updated successfully");

            }
            catch (Exception ex) 
            {
                await _unitOfWork.LogErrorAsync("UpdateRestaurantShippingFeeHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private void UpdateShippingFee(RestaurantProfile restaurant, decimal shippingFee)
        {
            restaurant.ShippingFee = shippingFee;
            restaurant.UpdatedAt = DateTime.UtcNow;
        }

       

        private async Task<RestaurantProfile?> GetRestaurantByOwnerIdAsync(Guid userId)
        {
            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == userId,
                include: q => q.Include(u => u.Profile)
                );
            var userProfile = users.FirstOrDefault()?.Profile?.Id;

            if (userProfile == null) return null;
            var restaurants = await _restaurantProfileRepository.GetAsync(
                predicate: r => r.OwnerId == userProfile,
                disableTracking: false
                );

            return restaurants.FirstOrDefault();
        }
    }
}
