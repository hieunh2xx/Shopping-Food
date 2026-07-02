using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class GetSellerReviewsHandler : IRequestHandler<GetSellerReviewsQuery, ApiResponse>
    {
        private readonly IProductReviewRepository _productReviewRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IMapper _mapper;

        public GetSellerReviewsHandler(
            IProductReviewRepository productReviewRepository,
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            IMapper mapper)
        {
            _productReviewRepository = productReviewRepository;
            _userRepository = userRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetSellerReviewsQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null ||
                (userProfile.Role != UserRole.Seller && userProfile.Role != UserRole.Mall))
                return ApiResponse.Failure(403, "Only sellers can access this endpoint.");

            var restaurants = await _restaurantProfileRepository.GetAsync(
                predicate: r => r.OwnerId == userProfile.Id,
                disableTracking: true
            );
            var restaurant = restaurants.FirstOrDefault();
            if (restaurant == null)
                return ApiResponse.Failure(404, "You do not have a registered restaurant.");

            var reviews = await _productReviewRepository.GetAsync(
                predicate: r => r.Product.RestaurantId == restaurant.Id,
                include: q => q.Include(r => r.UserProfile)
                               .Include(r => r.Product),
                orderBy: q => q.OrderByDescending(r => r.CreatedAt),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
            );

            var total = await _productReviewRepository.GetCountAsync(
                predicate: r => r.Product.RestaurantId == restaurant.Id
            );

            var dtos = _mapper.Map<List<ProductReviewDto>>(reviews);
            return ApiResponse.Success(dtos, "Seller reviews retrieved successfully.", total);
        }
    }
}
