using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.User;
using ShoppingFood.Repository.Interfaces;

using ShoppingFood.Domain.Context;

namespace ShoppingFood.Application.Features.Users.Queries
{
    public class GetUserProfileHandler : IRequestHandler<GetUserProfileQuery, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly ShoppingFoodContext _dbContext;

        public GetUserProfileHandler(IUserRepository userRepository, ShoppingFoodContext dbContext)
        {
            _userRepository = userRepository;
            _dbContext = dbContext;
        }

        public async Task<ApiResponse> Handle(GetUserProfileQuery request, CancellationToken cancellationToken)
        {
            var existingUsers = await _userRepository.GetAsync(
                predicate: u => u.UserName == request.Username,
                include: q => q.Include(u => u.Profile)
            );
            var user = existingUsers.FirstOrDefault();

            if (user == null)
            {
                return ApiResponse.Failure(404, "User not found.");
            }

            SellerInfoDto? sellerInfo = null;
            if (user.Profile != null && (user.Profile.Role == ShoppingFood.Domain.Enums.UserRole.Seller || user.Profile.Role == ShoppingFood.Domain.Enums.UserRole.Mall))
            {
                var restaurant = await _dbContext.RestaurantProfiles
                    .FirstOrDefaultAsync(r => r.OwnerId == user.Profile.Id, cancellationToken);
                
                if (restaurant != null)
                {
                    sellerInfo = new SellerInfoDto
                    {
                        RestaurantId = restaurant.Id,
                        RestaurantName = restaurant.RestaurantName,
                        Status = restaurant.Status.ToString(),
                        Address = restaurant.Address,
                        AverageRating = restaurant.AverageRating,
                        ReviewCount = restaurant.ReviewCount,
                        LogoUrl = restaurant.LogoUrl
                    };
                }
            }

            var lp = await _dbContext.LoyaltyPoints
                .FirstOrDefaultAsync(lp => lp.UserAccountId == user.Id, cancellationToken);

            var userDto = new UserDto
            {
                Id = user.Id,
                UserName = user.UserName!,
                FullName = user.Profile?.FullName ?? user.UserName!,
                Role = user.Profile?.Role.ToString() ?? "Customer",
                Status = user.Status.ToString(),
                Email = user.Email,
                IsEmailActive = user.IsEmailActive,
                Phone = user.Phone,
                AvatarUrl = user.Profile?.AvatarUrl,
                Gender = user.Profile?.Gender,
                DateOfBirth = user.Profile?.DateOfBirth,
                SellerInfo = sellerInfo,
                CreatedAt = user.CreatedAt,
                Tier = lp?.Tier.ToString(),
                TotalEarnedPoints = lp?.TotalEarnedPoints ?? 0,
                PointsBalance = lp?.PointsBalance ?? 0
            };

            return ApiResponse.Success(userDto, "User profile retrieved successfully.");
        }
    }
}
