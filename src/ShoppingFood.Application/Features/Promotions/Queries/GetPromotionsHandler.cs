using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Dto.Promotion;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Promotions.Queries
{
    public class GetPromotionsHandler : IRequestHandler<GetPromotionsQuery, ApiResponse>
    {
        private readonly IBuyXGetYPromotionRepository _promotionRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IMapper _mapper;

        public GetPromotionsHandler(
            IBuyXGetYPromotionRepository buyXGetYPromotionRepository,
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            IMapper mapper)
        {
            _promotionRepository = buyXGetYPromotionRepository;
            _userRepository = userRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetPromotionsQuery request, CancellationToken cancellationToken)
        {
            Guid? filterRestaurantId = request.RestaurantId;
            bool? filterIsActive = request.IsActive;

            if (request.CurrentUserId.HasValue)
            {
                var users = await _userRepository.GetAsync(
                    predicate: u => u.Id == request.CurrentUserId.Value,
                    include: q => q.Include(u => u.Profile),
                    disableTracking: true
                    );
                var userProfile = users.FirstOrDefault()?.Profile;
                if (userProfile != null)
                {
                    if (userProfile.Role == UserRole.Seller || userProfile.Role == UserRole.Mall)
                    {
                        var restaurants = await _restaurantProfileRepository.GetAsync(
                            predicate: r => r.OwnerId == userProfile.Id,
                            disableTracking: true
                            );
                        var restaurant = restaurants.FirstOrDefault();
                        if (restaurant != null) filterRestaurantId = restaurant.Id;
                    }
                    else if (userProfile.Role == UserRole.Customer)
                        filterIsActive = true;
                }
            }
            else
            {
                if (!filterRestaurantId.HasValue)
                    return ApiResponse.Failure(400, "RestaurantId is required for guest user.");
                filterIsActive = true;
            }
            var promotions = await _promotionRepository.GetAsync(
                predicate: p => (filterRestaurantId == null || p.RestaurantId == filterRestaurantId) &&
                                (!filterIsActive.HasValue || p.IsActive == filterIsActive.Value),
                include: q => q.Include(p => p.TriggerProduct).Include(p => p.GiftProduct),
                disableTracking: true
                );

            var dto = _mapper.Map<List<BuyXGetYPromotionDto>>(promotions);
            return ApiResponse.Success(dto, "Get list promotion successfully.");
        }
    }
}
