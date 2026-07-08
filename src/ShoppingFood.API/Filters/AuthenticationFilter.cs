using System;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Security;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Dto.Security;
using ShoppingFood.Dto.User;

namespace ShoppingFood.API.Filters
{
    public class AuthenticationFilter : IAsyncActionFilter
    {
        private readonly IConfiguration _configuration;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ShoppingFoodContext _dbContext;
        private readonly IMapper _mapper;

        public AuthenticationFilter(IConfiguration configuration, IUnitOfWork unitOfWork, ShoppingFoodContext dbContext, IMapper mapper)
        {
            _configuration = configuration;
            _unitOfWork = unitOfWork;
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var path = context.HttpContext.Request.Path.Value ?? string.Empty;
            var method = context.HttpContext.Request.Method;
            // Bypass authentication for public endpoints
            bool isBypassPath = path == "/" ||
                                path.StartsWith("/api/User/Login", StringComparison.OrdinalIgnoreCase) ||
                                path.StartsWith("/api/User/Register", StringComparison.OrdinalIgnoreCase) ||
                                path.StartsWith("/api/User/RegisterShipper", StringComparison.OrdinalIgnoreCase) ||
                                path.StartsWith("/api/User/UploadImage", StringComparison.OrdinalIgnoreCase) ||
                                path.StartsWith("/api/User/RefreshToken", StringComparison.OrdinalIgnoreCase) ||
                                path.StartsWith("/api/User/SendLoginOtp", StringComparison.OrdinalIgnoreCase) ||
                                path.StartsWith("/api/User/VerifyLoginOtp", StringComparison.OrdinalIgnoreCase) ||
                                path.StartsWith("/api/User/SendOtp", StringComparison.OrdinalIgnoreCase) ||
                                path.StartsWith("/api/User/Logout", StringComparison.OrdinalIgnoreCase) ||
                                path.StartsWith("/api/User/ForgotPassword", StringComparison.OrdinalIgnoreCase) ||
                                path.StartsWith("/api/User/VerifyResetOtp", StringComparison.OrdinalIgnoreCase) ||
                                path.StartsWith("/api/User/ResetPassword", StringComparison.OrdinalIgnoreCase) ||
                                path.StartsWith("/api/User/VerifyUnlockAccount", StringComparison.OrdinalIgnoreCase) ||
                                path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase) ||
                                path.StartsWith("/hubs/", StringComparison.OrdinalIgnoreCase) ||

                                (method == "GET" && path.StartsWith("/api/System", StringComparison.OrdinalIgnoreCase)) ||
                                (method == "GET" && path.StartsWith("/api/Faq", StringComparison.OrdinalIgnoreCase)) ||

                                (method == "GET" &&
                                    path.StartsWith("/api/Product", StringComparison.OrdinalIgnoreCase)) ||

                                (method == "GET" &&
                                    path.StartsWith("/api/Restaurant", StringComparison.OrdinalIgnoreCase) &&
                                    !path.Equals("/api/Restaurant/favorites", StringComparison.OrdinalIgnoreCase) &&
                                    !path.Equals("/api/Restaurant/DashboardStats", StringComparison.OrdinalIgnoreCase)) ||

                                (method == "GET" &&
                                    path.StartsWith("/api/Admin/GlobalMenuCategory", StringComparison.OrdinalIgnoreCase)) ||

                                (method == "GET" &&
                                    path.StartsWith("/api/FlashSale", StringComparison.OrdinalIgnoreCase)) ||

                                (method == "GET" &&
                                    path.Equals("/api/LoyaltyPoint/gifts", StringComparison.OrdinalIgnoreCase)) ||

                                (method == "GET" &&
                                    path.Equals("/api/Payment/methods", StringComparison.OrdinalIgnoreCase)) ||

                                (method == "POST" &&
                                    path.StartsWith("/api/Payment/sepay/ipn", StringComparison.OrdinalIgnoreCase)) ||

                                ((method == "GET" || method == "HEAD") &&
                                    path.Equals("/api/Payment/sepay/ipn", StringComparison.OrdinalIgnoreCase)) ||

                                (method == "POST" &&
                                    path.StartsWith("/api/Payment/sepay/webhook", StringComparison.OrdinalIgnoreCase)) ||

                                ((method == "GET" || method == "HEAD") &&
                                    (path.Equals("/api/Payment/sepay/webhook", StringComparison.OrdinalIgnoreCase) ||
                                     path.StartsWith("/api/Payment/sepay/webhook/", StringComparison.OrdinalIgnoreCase))) ||

                                (method == "GET" &&
                                    path.StartsWith("/api/Payment/sepay/session/status", StringComparison.OrdinalIgnoreCase));

            bool isGuestCartRequest = (path.StartsWith("/api/Cart", StringComparison.OrdinalIgnoreCase) ||
                                       path.StartsWith("/api/Order/checkout", StringComparison.OrdinalIgnoreCase) ||
                                       path.StartsWith("/api/Order/update", StringComparison.OrdinalIgnoreCase) ||
                                       path.StartsWith("/api/Order/cancel", StringComparison.OrdinalIgnoreCase) ||
                                       path.StartsWith("/api/Order/details", StringComparison.OrdinalIgnoreCase) ||
                                       path.StartsWith("/api/Order/GuestOrders", StringComparison.OrdinalIgnoreCase) ||
                                       path.StartsWith("/api/Discount/apply", StringComparison.OrdinalIgnoreCase) ||
                                       (method == "GET" && path.StartsWith("/api/Discount", StringComparison.OrdinalIgnoreCase)) ||
                                       (method == "GET" && path.StartsWith("/api/Promotion", StringComparison.OrdinalIgnoreCase))) &&
                                      !context.HttpContext.Request.Headers.ContainsKey("Authorization");

            if (isBypassPath || isGuestCartRequest)
            {
                if (context.HttpContext.Request.Headers.ContainsKey("Authorization"))
                {
                    try
                    {
                        string optToken = context.HttpContext.Request.Headers["Authorization"]!;
                        if (optToken.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                        {
                            optToken = optToken.Substring("Bearer ".Length).Trim();
                        }
                        string optUsername = TokenHelper.GetUsernameFromToken(optToken, _configuration);
                        var optUser = await _dbContext.Users
                            .Include(u => u.Profile)
                            .AsNoTracking()
                            .FirstOrDefaultAsync(u => u.UserName == optUsername);
                        if (optUser != null)
                        {
                            var mappedUserDto = _mapper.Map<UserDto>(optUser);
                            context.HttpContext.User = new MyPrincipal(mappedUserDto);
                        }
                    }
                    catch
                    {
                        // Fail silently for bypass/guest request
                    }
                }
                await next();
                return;
            }

            if (!context.HttpContext.Request.Headers.ContainsKey("Authorization"))
            {
                throw new UnauthorizedAccessException("Authorization Header Missing");
            }

            string token = context.HttpContext.Request.Headers["Authorization"]!;
            if (token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                token = token.Substring("Bearer ".Length).Trim();
            }

            // Decode username
            string username;
            try
            {
                username = TokenHelper.GetUsernameFromToken(token, _configuration);
            }
            catch (SecurityTokenException)
            {
                throw new UnauthorizedAccessException("Invalid token format");
            }

            // Fetch user
            var user = await _dbContext.Users
                .Include(u => u.Profile)
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserName == username);

            if (user == null)
            {
                throw new UnauthorizedAccessException($"User '{username}' not found");
            }

            var userDto = _mapper.Map<UserDto>(user);
            context.HttpContext.User = new MyPrincipal(userDto);

            var endpoint = await _dbContext.ApiEndpoints
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Path.ToLower() == path.ToLower() && e.Method.ToUpper() == method.ToUpper());

            if (endpoint != null && user.Profile?.Role != UserRole.Admin)
            {
                if (!endpoint.IsPublished)
                {
                    context.Result = new ObjectResult(ApiResponse.Failure(403, "This API endpoint is currently unpublished.")) { StatusCode = 403 };
                    return;
                }

                var userPerm = await _dbContext.UserPermissions
                    .AsNoTracking()
                    .FirstOrDefaultAsync(up => up.UserAccountId == user.Id && up.ApiEndpointId == endpoint.Id);

                if (userPerm != null)
                {
                    if (!userPerm.IsGranted)
                    {
                        context.Result = new ObjectResult(ApiResponse.Failure(403, "You do not have permission to access this endpoint.")) { StatusCode = 403 };
                        return;
                    }
                }
                else
                {
                    var rolePerm = await _dbContext.RolePermissions
                        .AsNoTracking()
                        .AnyAsync(rp => rp.Role == user.Profile!.Role && rp.ApiEndpointId == endpoint.Id);

                    if (!rolePerm)
                    {
                        context.Result = new ObjectResult(ApiResponse.Failure(403, "Your role does not have permission to access this endpoint.")) { StatusCode = 403 };
                        return;
                    }
                }
            }
            // Hardcoded permissions have been removed. RolePermissions from DB are now exclusively used.

            // Inject CurrentUserId into Commands/Queries
            foreach (var arg in context.ActionArguments.Values)
            {
                if (arg is Core.Base.BaseCommand command)
                {
                    command.CurrentUserId = user.Id;
                }
                else if (arg is Core.Base.BaseQuery query)
                {
                    query.CurrentUserId = user.Id;
                }
            }

            // Serialize and log the audit action
            string requestData = string.Empty;
            if (context.ActionArguments != null && context.ActionArguments.Count > 0)
            {
                // Strip passwords or sensitive fields from log payload for security compliance
                var safeArgs = context.ActionArguments.ToDictionary(
                    k => k.Key,
                    v => v.Value is ShoppingFood.Application.Features.Users.Commands.AddUserCommand c ? new { c.UserName, c.FullName, c.Email, c.Phone, c.Role } : v.Value
                );
                requestData = JsonConvert.SerializeObject(safeArgs);
            }

            var actionLog = new ActionLog
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                UserName = user.UserName ?? string.Empty,
                Action = $"{context.HttpContext.Connection.RemoteIpAddress}||{context.HttpContext.Request.Method}||{context.HttpContext.Request.Path}",
                CreatedAt = DateTime.UtcNow,
                CreatedBy = user.Id,
                Message = requestData
            };

            await _unitOfWork.LogActionAsync(actionLog);

            await next();
        }
    }
}
