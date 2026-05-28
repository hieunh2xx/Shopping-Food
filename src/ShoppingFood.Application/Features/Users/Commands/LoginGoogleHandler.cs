using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Google.Apis.Auth;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Core.Security;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class LoginGoogleHandler : IRequestHandler<LoginGoogleCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;

        public LoginGoogleHandler(IUserRepository userRepository, IUnitOfWork unitOfWork, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }

        public async Task<ApiResponse> Handle(LoginGoogleCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var clientId = _configuration["GoogleAuth:ClientId"];
                if (string.IsNullOrEmpty(clientId))
                {
                    return ApiResponse.Failure(400, "Google Auth is not configured on the server.");
                }

                var settings = new GoogleJsonWebSignature.ValidationSettings()
                {
                    Audience = new[] { clientId }
                };

                GoogleJsonWebSignature.Payload payload;
                try
                {
                    payload = await GoogleJsonWebSignature.ValidateAsync(request.Credential, settings);
                }
                catch (InvalidJwtException)
                {
                    return ApiResponse.Failure(400, "Invalid Google credential token.");
                }

                // Check if user exists by email
                var users = await _userRepository.GetAsync(
                    predicate: u => u.Email == payload.Email,
                    include: query => query.Include(u => u.Profile)!
                );
                
                var user = users.FirstOrDefault();

                if (user == null)
                {
                    user = new User
                    {
                        Id = Guid.NewGuid(),
                        UserName = payload.Email,
                        Email = payload.Email,
                        PasswordHash = Guid.NewGuid().ToString(), 
                        Status = UserStatus.Active,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    var profile = new UserProfile
                    {
                        Id = Guid.NewGuid(),
                        UserAccountId = user.Id,
                        FullName = payload.Name ?? payload.Email,
                        AvatarUrl = payload.Picture,
                        Role = UserRole.Customer,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    user.Profile = profile;

                    _userRepository.Add(user);
                    await _unitOfWork.SaveChangesAsync();
                }

                var secretKey = _configuration["JwtSettings:Secret"] ?? "SuperSecretShoppingFoodKey1234567890SecretSignatureKey";
                var issuer = _configuration["JwtSettings:Issuer"] ?? "ShoppingFoodAPI";
                var audience = _configuration["JwtSettings:Audience"] ?? "ShoppingFoodClient";

                var token = TokenHelper.GenerateToken(user.UserName!, secretKey, issuer, audience);
                var refreshToken = TokenHelper.GenerateRefreshToken();

                user.RefreshToken = refreshToken;
                user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
                _userRepository.Update(user);
                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(new
                {
                    Token = token,
                    RefreshToken = refreshToken,
                    Username = user.UserName,
                    FullName = user.Profile?.FullName,
                    Role = user.Profile?.Role.ToString(),
                    AvatarUrl = user.Profile?.AvatarUrl
                }, "Google login successful");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("LoginGoogleHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred during Google Login: {ex.Message}");
            }
        }
    }
}
