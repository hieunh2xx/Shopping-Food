using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Core.Security;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class RefreshTokenHandler : IRequestHandler<RefreshTokenCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;

        public RefreshTokenHandler(
            IUserRepository userRepository,
            IUnitOfWork unitOfWork,
            IConfiguration configuration)
        {
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }

        public async Task<ApiResponse> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.RefreshToken))
                {
                    return ApiResponse.Failure(400, "Invalid client request");
                }

                string username;
                try
                {
                    username = TokenHelper.GetUsernameFromToken(request.Token, _configuration);
                }
                catch
                {
                    return ApiResponse.Failure(400, "Invalid token format");
                }

                if (string.IsNullOrEmpty(username))
                {
                    return ApiResponse.Failure(400, "Invalid token");
                }

                var existingUsers = await _userRepository.GetAsync(
                    predicate: u => u.UserName == username,
                    include: q => q.Include(u => u.Profile)
                );
                var user = existingUsers.FirstOrDefault();

                if (user == null || user.RefreshToken != request.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
                {
                    return ApiResponse.Failure(400, "Invalid refresh token or token expired");
                }

                var secretKey = _configuration["JwtSettings:Secret"] ?? "SuperSecretShoppingFoodKey1234567890";
                var issuer = _configuration["JwtSettings:Issuer"] ?? "ShoppingFoodAPI";
                var audience = _configuration["JwtSettings:Audience"] ?? "ShoppingFoodClient";

                var newAccessToken = TokenHelper.GenerateToken(user.UserName!, secretKey, issuer, audience);
                var newRefreshToken = TokenHelper.GenerateRefreshToken();

                user.RefreshToken = newRefreshToken;
                user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
                _userRepository.Update(user);
                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(new
                {
                    Token = newAccessToken,
                    RefreshToken = newRefreshToken,
                    Username = user.UserName,
                    FullName = user.Profile?.FullName,
                    Role = user.Profile?.Role.ToString(),
                    AvatarUrl = user.Profile?.AvatarUrl
                }, "Token refreshed successfully");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("RefreshTokenHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred during token refresh: {ex.Message}");
            }
        }
    }
}
