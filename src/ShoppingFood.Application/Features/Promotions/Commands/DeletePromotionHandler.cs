using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Promotions.Commands
{
    public class DeletePromotionHandler : IRequestHandler<DeletePromotionCommand, ApiResponse>
    {
        private readonly IBuyXGetYPromotionRepository _promotionRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DeletePromotionHandler(
            IBuyXGetYPromotionRepository buyXGetYPromotionRepository,
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            IUnitOfWork unitOfWork)
        {
            _promotionRepository = buyXGetYPromotionRepository;
            _userRepository = userRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(DeletePromotionCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");
            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile)
            );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null)
                return ApiResponse.Failure(404, "User profile not found");

            var promotion = await _promotionRepository.GetByIdAsync(request.Id);
            if (promotion == null)
                return ApiResponse.Failure(404, "Promotion program not found.");
         
            if (promotion.StartDate <= DateTime.UtcNow)
            {
                return ApiResponse.Failure(400, "Cannot delete a promotion program that has already started. Please turn it off (IsActive = false) instead.");
            }
           
            if (userProfile.Role != UserRole.Seller && userProfile.Role != UserRole.Mall)
            {
                return ApiResponse.Failure(403, "Forbidden. Only sellers and malls can delete promotion programs.");
            }

            var restaurants = await _restaurantProfileRepository.GetAsync(
                predicate: r => r.OwnerId == userProfile.Id,
                disableTracking: true
            );
            var restaurant = restaurants.FirstOrDefault();
            if (restaurant == null || promotion.RestaurantId != restaurant.Id)
                return ApiResponse.Failure(403, "Forbidden. You do not own this promotion program.");

            _promotionRepository.Delete(promotion);
            await _unitOfWork.SaveChangesAsync();
            return ApiResponse.Success(null, "Promotion program deleted successfully.");
        }
    }
}
