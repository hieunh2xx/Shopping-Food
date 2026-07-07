using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Discount;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Discounts.Commands
{
    public class CreateDiscountHandler : IRequestHandler<CreateDiscountCommand, ApiResponse>
    {
        private readonly IDiscountRepository _discountRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public CreateDiscountHandler(
            IDiscountRepository discountRepository,
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _discountRepository = discountRepository;
            _userRepository = userRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(CreateDiscountCommand request, CancellationToken cancellationToken)
        {
            try
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

                var discount = _mapper.Map<Discount>(request);
                discount.Id = Guid.NewGuid();
                discount.CreatedAt = DateTime.UtcNow;
                discount.UpdatedAt = DateTime.UtcNow;
                discount.UsedCount = 0;
                discount.Status = DiscountStatus.Active;
                
                if(userProfile.Role == UserRole.Seller || userProfile.Role == UserRole.Mall)
                {
                    var restaurants = await _restaurantProfileRepository.GetAsync(
                        predicate: r => r.OwnerId == userProfile.Id,
                        disableTracking: true
                        );
                    var restaurant = restaurants.FirstOrDefault();
                    if (restaurant == null)
                        return ApiResponse.Failure(404, "Restaurant not found in your account.");

                    discount.RestaurantId = restaurant.Id;
                }
                else if(userProfile.Role == UserRole.Admin)
                {
                    discount.RestaurantId = request.RestaurantId;
                }


                _discountRepository.Add(discount);

                await _unitOfWork.SaveChangesAsync();

                var dto = _mapper.Map<DiscountDto>(discount);
                return ApiResponse.Success(dto, "Create discount successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("CreateDiscountHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}
