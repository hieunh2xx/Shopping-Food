using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FirebaseAdmin.Auth;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Security;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.User;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class LoginFirebasePhoneCommand : IRequest<ApiResponse>
    {
        public string IdToken { get; set; } = string.Empty;
    }

    public class LoginFirebasePhoneHandler : IRequestHandler<LoginFirebasePhoneCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _dbContext;
        private readonly IConfiguration _configuration;

        public LoginFirebasePhoneHandler(ShoppingFoodContext dbContext, IConfiguration configuration)
        {
            _dbContext = dbContext;
            _configuration = configuration;
        }

        public async Task<ApiResponse> Handle(LoginFirebasePhoneCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.IdToken))
            {
                return ApiResponse.Failure(400, "Firebase ID Token is required.");
            }

            FirebaseToken decodedToken;
            try
            {
                // Verify the ID token first
                decodedToken = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(request.IdToken, cancellationToken);
            }
            catch (Exception ex)
            {
                return ApiResponse.Failure(401, "Invalid Firebase ID Token: " + ex.Message);
            }

            // Extract phone number
            if (!decodedToken.Claims.TryGetValue("phone_number", out var phoneObj) || phoneObj == null)
            {
                return ApiResponse.Failure(400, "Phone number not found in Firebase Token.");
            }

            var phone = phoneObj.ToString();

            // Format phone to our local standard if needed (Firebase returns +84...)
            if (phone.StartsWith("+84"))
            {
                phone = "0" + phone.Substring(3);
            }

            // Find user or create if not exists
            var user = await _dbContext.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.Phone == phone, cancellationToken);

            if (user == null)
            {
                // Auto register
                user = new User
                {
                    Id = Guid.NewGuid(),
                    UserName = phone,
                    Phone = phone,
                    PasswordHash = "FIREBASE_PHONE_LOGIN", // Placeholder
                    Status = UserStatus.Active,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                user.Profile = new UserProfile
                {
                    Id = Guid.NewGuid(),
                    UserAccountId = user.Id,
                    FullName = "Khách hàng",
                    Role = UserRole.Customer
                };

                _dbContext.Users.Add(user);
            }

            var secretKey = _configuration["JwtSettings:Secret"] ?? "SuperSecretShoppingFoodKey1234567890";
            var issuer = _configuration["JwtSettings:Issuer"] ?? "ShoppingFoodAPI";
            var audience = _configuration["JwtSettings:Audience"] ?? "ShoppingFoodClient";

            var token = TokenHelper.GenerateToken(user.UserName ?? user.Phone!, secretKey, issuer, audience);
            var refreshToken = TokenHelper.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            
            await _dbContext.SaveChangesAsync(cancellationToken);

            var loginResponse = new LoginResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
                Username = user.UserName,
                FullName = user.Profile?.FullName,
                Role = user.Profile?.Role.ToString(),
                AvatarUrl = user.Profile?.AvatarUrl
            };

            return ApiResponse.Success(loginResponse, "Login successful");
        }
    }
}
