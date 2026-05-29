using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
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
    public class LoginByPhoneHandler : IRequestHandler<LoginByPhoneCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _dbContext;
        private readonly IConfiguration _configuration;

        public LoginByPhoneHandler(ShoppingFoodContext dbContext, IConfiguration configuration)
        {
            _dbContext = dbContext;
            _configuration = configuration;
        }

        public async Task<ApiResponse> Handle(LoginByPhoneCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Phone) || string.IsNullOrWhiteSpace(request.OtpCode))
            {
                return ApiResponse.Failure(400, "Phone and OTP code are required.");
            }

            // Verify OTP
            var otpRecord = await _dbContext.OtpRecords
                .Where(o => o.EmailOrPhone == request.Phone 
                            && o.OtpCode == request.OtpCode 
                            && !o.IsUsed)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (otpRecord == null)
            {
                return ApiResponse.Failure(400, "Invalid OTP.");
            }

            if (otpRecord.ExpiryTime < DateTime.UtcNow)
            {
                return ApiResponse.Failure(400, "OTP has expired.");
            }

            // Mark OTP as used
            otpRecord.IsUsed = true;
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Find user or create if not exists
            var user = await _dbContext.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.Phone == request.Phone, cancellationToken);

            if (user == null)
            {
                // Auto register
                user = new User
                {
                    Id = Guid.NewGuid(),
                    UserName = request.Phone,
                    Phone = request.Phone,
                    PasswordHash = "OTP_LOGIN", // Placeholder for OTP only login users
                    Status = UserStatus.Active,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                user.Profile = new UserProfile
                {
                    Id = Guid.NewGuid(),
                    UserAccountId = user.Id,
                    FullName = "Người dùng",
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
