using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Core.Security;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class LoginMicrosoftHandler : IRequestHandler<LoginMicrosoftCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;

        public LoginMicrosoftHandler(
            IUserRepository userRepository,
            IUnitOfWork unitOfWork,
            IConfiguration configuration)
        {
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }

        public async Task<ApiResponse> Handle(LoginMicrosoftCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Code))
                {
                    return ApiResponse.Failure(400, "Microsoft authorization code is missing.");
                }

                // Step 1: Exchange authorization code for access token
                var clientId = _configuration["MicrosoftAuth:ClientId"];
                var clientSecret = _configuration["MicrosoftAuth:ClientSecret"];

                if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
                {
                    return ApiResponse.Failure(400, "Microsoft Auth is not configured on the server.");
                }

                using var httpClient = new HttpClient();
                var tokenRequestBody = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    { "client_id", clientId },
                    { "client_secret", clientSecret },
                    { "code", request.Code },
                    { "redirect_uri", request.RedirectUri },
                    { "grant_type", "authorization_code" },
                    { "scope", "User.Read openid profile email" }
                });

                var tokenResponse = await httpClient.PostAsync(
                    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
                    tokenRequestBody,
                    cancellationToken);

                var tokenContent = await tokenResponse.Content.ReadAsStringAsync(cancellationToken);

                if (!tokenResponse.IsSuccessStatusCode)
                {
                    return ApiResponse.Failure(400, $"Failed to exchange authorization code: {tokenContent}");
                }

                var tokenResult = JsonConvert.DeserializeObject<MicrosoftTokenResponse>(tokenContent);
                if (tokenResult == null || string.IsNullOrEmpty(tokenResult.AccessToken))
                {
                    return ApiResponse.Failure(400, "Could not obtain access token from Microsoft.");
                }

                // Step 2: Use access token to get user info from Microsoft Graph
                httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenResult.AccessToken);
                var graphResponse = await httpClient.GetAsync("https://graph.microsoft.com/v1.0/me", cancellationToken);

                if (!graphResponse.IsSuccessStatusCode)
                {
                    return ApiResponse.Failure(400, "Invalid Microsoft token or token expired.");
                }

                var graphContent = await graphResponse.Content.ReadAsStringAsync(cancellationToken);
                var microsoftUser = JsonConvert.DeserializeObject<MicrosoftGraphUser>(graphContent);

                if (microsoftUser == null || string.IsNullOrEmpty(microsoftUser.UserPrincipalName))
                {
                    return ApiResponse.Failure(400, "Could not extract email from Microsoft profile.");
                }

                string email = microsoftUser.UserPrincipalName;
                string name = microsoftUser.DisplayName ?? "Microsoft User";

                // Step 3: Find or create user
                var existingUsers = await _userRepository.GetAsync(
                    predicate: u => u.Email == email,
                    include: q => q.Include(u => u.Profile)
                );
                var user = existingUsers.FirstOrDefault();

                if (user == null)
                {
                    string randomPassword = Guid.NewGuid().ToString("N");
                    
                    user = new User
                    {
                        Id = Guid.NewGuid(),
                        UserName = email,
                        PasswordHash = HashPassword(randomPassword),
                        Email = email,
                        Status = UserStatus.Active,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        Profile = new UserProfile
                        {
                            Id = Guid.NewGuid(),
                            FullName = name,
                            Role = UserRole.Customer,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        }
                    };

                    _userRepository.Add(user);
                    await _unitOfWork.SaveChangesAsync();
                }

                if (user.Status != UserStatus.Active)
                {
                    return ApiResponse.Failure(403, "Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt.");
                }

                // Step 4: Generate JWT and refresh token
                var secretKey = _configuration["JwtSettings:Secret"] ?? "SuperSecretShoppingFoodKey1234567890";
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
                }, "Đăng nhập Microsoft thành công");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("LoginMicrosoftHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred during Microsoft login: {ex.Message}");
            }
        }

        private static string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        private class MicrosoftTokenResponse
        {
            [JsonProperty("access_token")]
            public string AccessToken { get; set; } = string.Empty;

            [JsonProperty("token_type")]
            public string TokenType { get; set; } = string.Empty;

            [JsonProperty("expires_in")]
            public int ExpiresIn { get; set; }
        }

        private class MicrosoftGraphUser
        {
            [JsonProperty("displayName")]
            public string DisplayName { get; set; } = string.Empty;

            [JsonProperty("userPrincipalName")]
            public string UserPrincipalName { get; set; } = string.Empty;
        }
    }
}
