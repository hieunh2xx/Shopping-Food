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

namespace ShoppingFood.Application.Features.Discounts.Commands
{
    public class DeleteDiscountHandler : IRequestHandler<DeleteDiscountCommand, ApiResponse>
    {
        private readonly IDiscountRepository _discountRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DeleteDiscountHandler(
            IDiscountRepository discountRepository,
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            IUnitOfWork unitOfWork)
        {
            _discountRepository = discountRepository;
            _userRepository = userRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(DeleteDiscountCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile)
                );
            var user = users.FirstOrDefault();
            if (user?.Profile == null)
                return ApiResponse.Failure(404, "User profile not found.");

            var discounts = await _discountRepository.GetAsync(
                predicate: d => d.Id == request.Id && !d.IsDeleted,
                disableTracking: false
                );
            var discount = discounts.FirstOrDefault();
            if (discount == null)
                return ApiResponse.Failure(404, "Discount code not found.");

            if (user.Profile.Role == UserRole.Seller || user.Profile.Role == UserRole.Mall)
            {
                var restaurants = await _restaurantProfileRepository.GetAsync(
                    predicate: r => r.OwnerId == user.Profile.Id,
                    disableTracking: true
                    );
                var restaurant = restaurants.FirstOrDefault();
                if (restaurant == null || discount.RestaurantId != restaurant.Id)
                    return ApiResponse.Failure(403, "Access denied. You can only delete discounts belonging to your restaurant.");
            }


            discount.IsDeleted = true;
            discount.DeletedAt = DateTime.UtcNow;
            discount.Status = DiscountStatus.Inactive;
            discount.UpdatedAt = DateTime.UtcNow;

            _discountRepository.Update(discount);
            await _unitOfWork.SaveChangesAsync();
            return ApiResponse.Success(null, "Discount code deleted successfully.");
        }
    }
}
