using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Promotion;
using ShoppingFood.Repository.Implementations;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Promotions.Commands
{
    public class UpdatePromotionHandler : IRequestHandler<UpdatePromotionCommand, ApiResponse>
    {
        private readonly IBuyXGetYPromotionRepository _buyXGetYPromotionRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IProductRepository _productRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public UpdatePromotionHandler(
            IBuyXGetYPromotionRepository buyXGetYPromotionRepository,
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            IProductRepository productRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _buyXGetYPromotionRepository = buyXGetYPromotionRepository;
            _userRepository = userRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _productRepository = productRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(UpdatePromotionCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var restaurant = await GetRestaurantByOwnerIdAsync(request.CurrentUserId.Value);
            if (restaurant == null)
                return ApiResponse.Failure(403, "Forbidden. Only sellers with with a registered restaurant can setup promotion.");

            var promotion = await _buyXGetYPromotionRepository.GetByIdAsync(request.Id);
            if (promotion == null || promotion.RestaurantId != restaurant.Id)
                return ApiResponse.Failure(404, "Promotion program not found or does not belong to your restaurant.");

            var triggerProduct = await _productRepository.GetByIdAsync(request.TriggerProductId);
            if (triggerProduct == null || triggerProduct.RestaurantId != restaurant.Id || triggerProduct.IsHidden)
                return ApiResponse.Failure(400, "Trigger product not found or does not belong to your restaurant.");

            var giftProduct = await _productRepository.GetByIdAsync(request.GiftProductId);
            if (giftProduct == null || giftProduct.RestaurantId != restaurant.Id || giftProduct.IsHidden)
                return ApiResponse.Failure(400, "Gift product not found or does not belong to your restaurant.");

            bool isOverlapping = await HasOverlappingPromotionAsync(restaurant.Id, request.Id, request.TriggerProductId, request.StartDate, request.EndDate);
            if (isOverlapping)
                return ApiResponse.Failure(400, "An active buy x get y promotion already exists for this trigger product during the selected period.");

            promotion.TriggerProductId = request.TriggerProductId;
            promotion.BuyQuantity = request.BuyQuantity;
            promotion.GiftProductId = request.GiftProductId;
            promotion.GiftQuantity = request.GiftQuantity;
            promotion.StartDate = request.StartDate;
            promotion.EndDate = request.EndDate;
            promotion.IsActive = request.IsActive;

            _buyXGetYPromotionRepository.Update(promotion);
            await _unitOfWork.SaveChangesAsync();

            var updatedPromotion = (await _buyXGetYPromotionRepository.GetAsync(
                predicate: p => p.Id == promotion.Id,
                include: q => q.Include(p => p.TriggerProduct).Include(p => p.GiftProduct),
                disableTracking: true
                )).FirstOrDefault();

            var dto = _mapper.Map<BuyXGetYPromotionDto>(updatedPromotion);
            return ApiResponse.Success(dto, "Promotion updated successfully.");
        }

        private async Task<RestaurantProfile?> GetRestaurantByOwnerIdAsync(Guid userId)
        {
            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == userId,
                include: q => q.Include(u => u.Profile)
                );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null || (userProfile.Role != UserRole.Seller && userProfile.Role != UserRole.Mall))
                return null;

            var restaurants = await _restaurantProfileRepository.GetAsync(
                predicate: r => r.OwnerId == userProfile.Id,
                disableTracking: true
                );
            return restaurants.FirstOrDefault();
        }

        private async Task<bool> HasOverlappingPromotionAsync(Guid restaurantId, Guid currentPromoId, Guid triggerProductId, DateTime start, DateTime end)
        {
            return await _buyXGetYPromotionRepository.ExistsAsync(
                p => p.RestaurantId == restaurantId &&
                     p.Id != currentPromoId &&
                     p.TriggerProductId == triggerProductId &&
                     p.IsActive &&
                     !(p.EndDate <= start || p.StartDate >= end)
                );
        }

    }
}
