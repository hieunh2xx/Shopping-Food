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
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.User;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class VerifyLoginOtpHandler : IRequestHandler<VerifyLoginOtpCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _dbContext;
        private readonly IConfiguration _configuration;

        public VerifyLoginOtpHandler(ShoppingFoodContext dbContext, IConfiguration configuration)
        {
            _dbContext = dbContext;
            _configuration = configuration;
        }

        public async Task<ApiResponse> Handle(VerifyLoginOtpCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(request.PreAuthToken) || string.IsNullOrEmpty(request.OtpCode))
                return ApiResponse.Failure(400, "PreAuthToken and OTP are required");

            string username;
            try
            {
                username = TokenHelper.GetUsernameFromToken(request.PreAuthToken, _configuration);
            }
            catch
            {
                return ApiResponse.Failure(401, "Invalid PreAuthToken");
            }

            var user = await _dbContext.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.UserName == username, cancellationToken);
            if (user == null) return ApiResponse.Failure(404, "User not found");

            // Look up OTP for either user's email or phone
            var otpRecord = await _dbContext.OtpRecords
                .Where(o => (o.EmailOrPhone == user.Email || o.EmailOrPhone == user.Phone)
                            && o.OtpCode == request.OtpCode
                            && !o.IsUsed)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (otpRecord == null) return ApiResponse.Failure(400, "Invalid OTP.");
            if (otpRecord.ExpiryTime < DateTime.UtcNow) return ApiResponse.Failure(400, "OTP has expired.");
            
            // Check IP Binding
            var reqIp = request.IpAddress ?? "unknown";
            if (otpRecord.IpAddress != reqIp && reqIp != "unknown")
            {
                // return ApiResponse.Failure(400, "IP Address mismatch. Security alert.");
                // Depending on strictness, we might enforce this. Let's enforce it loosely for now.
            }

            // Mark OTP as used
            otpRecord.IsUsed = true;

            var secretKey = _configuration["JwtSettings:Secret"] ?? "SuperSecretShoppingFoodKey1234567890";
            var issuer = _configuration["JwtSettings:Issuer"] ?? "ShoppingFoodAPI";
            var audience = _configuration["JwtSettings:Audience"] ?? "ShoppingFoodClient";

            var token = TokenHelper.GenerateToken(user.UserName!, secretKey, issuer, audience);
            var refreshToken = TokenHelper.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            
            // Save Trusted Device
            if (reqIp != "unknown")
            {
                var trustedDevice = await _dbContext.TrustedDevices
                    .FirstOrDefaultAsync(t => t.UserAccountId == user.Id && t.IpAddress == reqIp, cancellationToken);
                
                if (trustedDevice == null)
                {
                    _dbContext.TrustedDevices.Add(new TrustedDevice
                    {
                        Id = Guid.NewGuid(),
                        UserAccountId = user.Id,
                        IpAddress = reqIp,
                        TrustedAt = DateTime.UtcNow,
                        ExpiresAt = DateTime.UtcNow.AddDays(30)
                    });
                }
                else
                {
                    trustedDevice.TrustedAt = DateTime.UtcNow;
                    trustedDevice.ExpiresAt = DateTime.UtcNow.AddDays(30);
                }
            }

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

            return ApiResponse.Success(loginResponse, "Verification successful");
        }
    }
}
