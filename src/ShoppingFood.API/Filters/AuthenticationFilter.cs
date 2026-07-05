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
                                    path.Equals("/api/FlashSale/active", StringComparison.OrdinalIgnoreCase)) ||

                                (method == "GET" &&
                                    path.Equals("/api/LoyaltyPoint/gifts", StringComparison.OrdinalIgnoreCase));

            bool isGuestCartRequest = (path.StartsWith("/api/Cart", StringComparison.OrdinalIgnoreCase) ||
                                       path.StartsWith("/api/Order/checkout", StringComparison.OrdinalIgnoreCase) ||
                                       path.StartsWith("/api/Order/update", StringComparison.OrdinalIgnoreCase) ||
                                       path.StartsWith("/api/Order/cancel", StringComparison.OrdinalIgnoreCase) ||
                                       path.StartsWith("/api/Order/details", StringComparison.OrdinalIgnoreCase) ||
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

            if (endpoint != null)
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

            // Phân quyền: CUD món ăn & topping chỉ dành cho Seller (ngoại trừ Report, Review và Reply review)
            if ((path.Contains("/api/Product", StringComparison.OrdinalIgnoreCase) ||
                 path.Contains("/api/Topping", StringComparison.OrdinalIgnoreCase)) &&
                !path.Equals("/api/Product/Report", StringComparison.OrdinalIgnoreCase) &&
                !path.Equals("/api/Product/review", StringComparison.OrdinalIgnoreCase) &&
                !path.Contains("/review/", StringComparison.OrdinalIgnoreCase) &&
                (method == "POST" ||
                 method == "PUT" ||
                 method == "DELETE" ||
                 method == "PATCH"))
            {
                if (user.Profile?.Role != UserRole.Seller)
                {
                    throw new UnauthorizedAccessException("Only the seller has the right to perform this operation.");
                }
            }
            // Phân quyền: Report và Review chỉ dành cho Customer
            if ((path.Equals("/api/Product/Report", StringComparison.OrdinalIgnoreCase) ||
                 path.Equals("/api/Product/review", StringComparison.OrdinalIgnoreCase)) &&
                method == "POST")
            {
                if (user.Profile?.Role != UserRole.Customer)
                {
                    throw new UnauthorizedAccessException("Only customers can report or review products.");
                }
            }

            // Phân quyền: Reply review — Seller và Mall only
            if (path.Contains("/api/Product", StringComparison.OrdinalIgnoreCase) &&
                path.Contains("/review/", StringComparison.OrdinalIgnoreCase) &&
                path.EndsWith("/reply", StringComparison.OrdinalIgnoreCase) &&
                path.EndsWith("/report", StringComparison.OrdinalIgnoreCase) &&
                method == "POST")
            {
                if (user.Profile?.Role != UserRole.Seller && user.Profile?.Role != UserRole.Mall)
                {
                    throw new UnauthorizedAccessException("Only sellers can reply to reviews.");
                }
            }

            if (path.Contains("/api/MenuCategory", StringComparison.OrdinalIgnoreCase) &&
               (method == "POST" ||
                 method == "PUT" ||
                 method == "DELETE" ||
                 method == "PATCH"))
            {
                if (user.Profile?.Role != UserRole.Seller)
                {
                    throw new UnauthorizedAccessException("Only the seller has the right to perform this operation.");
                }
            }

            if (path.Contains("/api/Admin", StringComparison.OrdinalIgnoreCase))
            {
                if (user.Profile?.Role != UserRole.Admin)
                {
                    throw new UnauthorizedAccessException("Only the admin has the right to perform this operation");
                }
            }

            if ((path.Equals("/api/LoyaltyPoint/evaluate-tiers", StringComparison.OrdinalIgnoreCase) ||
                 path.Equals("/api/LoyaltyPoint/adjust-user-tier", StringComparison.OrdinalIgnoreCase) ||
                 (path.Equals("/api/LoyaltyPoint/tier-configs", StringComparison.OrdinalIgnoreCase) && method != "GET")) &&
                user.Profile?.Role != UserRole.Admin)
            {
                throw new UnauthorizedAccessException("Only the admin has the right to perform this operation.");
            }

            if (path.StartsWith("/api/Shipper", StringComparison.OrdinalIgnoreCase) &&
                !path.Equals("/api/Shipper/review", StringComparison.OrdinalIgnoreCase))
            {
                if (user.Profile?.Role != UserRole.Shipper)
                {
                    throw new UnauthorizedAccessException("Only shippers have the right to perform this operation.");
                }
            }

            // Phân quyền: đánh giá tài xế — chỉ Customer
            if (path.Equals("/api/Shipper/review", StringComparison.OrdinalIgnoreCase) &&
                method == "POST")
            {
                if (user.Profile?.Role != UserRole.Customer)
                {
                    throw new UnauthorizedAccessException("Only customers can review shippers.");
                }
            }

            if ((path.Contains("/api/Restaurant/Favorite", StringComparison.OrdinalIgnoreCase) ||
                 path.Contains("/api/Restaurant/Favorites", StringComparison.OrdinalIgnoreCase)))
            {
                if (user.Profile?.Role != UserRole.Customer)
                {
                    throw new UnauthorizedAccessException("Only customers can use favorite restaurant features.");
                }
            }

            if (path.StartsWith("/api/Restaurant", StringComparison.OrdinalIgnoreCase) &&
                !path.Contains("/favorite", StringComparison.OrdinalIgnoreCase) &&
                !path.Contains("/favorites", StringComparison.OrdinalIgnoreCase) &&
                (method == "PUT" ||
                 method == "POST" ||
                 method == "DELETE"))
            {
                if (user.Profile?.Role != UserRole.Seller)
                {
                    throw new UnauthorizedAccessException("Only the seller can update restaurant settings.");
                }
            }

            if ((path.Equals("/api/Order/accept", StringComparison.OrdinalIgnoreCase) ||
                 path.Equals("/api/Order/reject", StringComparison.OrdinalIgnoreCase) ||
                 path.Equals("/api/Order/prepare", StringComparison.OrdinalIgnoreCase) ||
                 path.Equals("/api/Order/waiting-for-shipper", StringComparison.OrdinalIgnoreCase) ||
                 path.Equals("/api/Order/seller-cancel", StringComparison.OrdinalIgnoreCase)) &&
                method == "POST")
            {
                if (user.Profile?.Role != UserRole.Seller)
                {
                    throw new UnauthorizedAccessException("Only the seller has the right to perform this operation.");
                }
            }

            if (path.Contains("/api/Coordinator/", StringComparison.OrdinalIgnoreCase))
            {
                if (user.Profile?.Role != UserRole.Admin && user.Profile?.Role != UserRole.Coordinator)
                {
                    throw new UnauthorizedAccessException("Only the admin/coordinator have the right to perform this operation");
                }
            }

            if (path.StartsWith("/api/Discount", StringComparison.OrdinalIgnoreCase))
            {
                if (method == "PATCH" && path.EndsWith("/lock", StringComparison.OrdinalIgnoreCase))
                {
                    if (user.Profile?.Role != UserRole.Admin)
                        throw new UnauthorizedAccessException("Only admin can emergency lock discount codes.");
                }

                else if (method == "POST" && path.Equals("/api/Discount/save", StringComparison.OrdinalIgnoreCase))
                {
                    if (user.Profile?.Role != UserRole.Customer)
                        throw new UnauthorizedAccessException("Only customers can save discounts to their wallet.");
                }

                else if (method == "GET" && path.Equals("/api/Discount/stats", StringComparison.OrdinalIgnoreCase))
                {
                    if (user.Profile?.Role != UserRole.Seller && user.Profile?.Role != UserRole.Mall)
                        throw new UnauthorizedAccessException("Only sellers can view discount statistics.");
                }

                else if ((method == "POST" || method == "PUT" || method == "DELETE" || method == "PATCH") &&
                         !path.Equals("/api/Discount/apply", StringComparison.OrdinalIgnoreCase))
                {
                    if (user.Profile?.Role != UserRole.Admin &&
                        user.Profile?.Role != UserRole.Seller &&
                        user.Profile?.Role != UserRole.Mall)
                        throw new UnauthorizedAccessException("Only admin/seller/mall have the right to perform this operation.");
                }
            }

            if (path.StartsWith("/api/Promotion", StringComparison.OrdinalIgnoreCase) &&
                (method == "POST" ||
                method == "PUT" ||
                method == "DELETE" ||
                method == "PATCH"))
            {
                if (user.Profile?.Role != UserRole.Seller &&
                     user.Profile?.Role != UserRole.Mall)
                {
                    throw new UnauthorizedAccessException("Only sellers and malls have the right to configure promotion programs.");
                }
            }

            if (path.StartsWith("/api/Support/appeal", StringComparison.OrdinalIgnoreCase))
            {
                if (user.Profile?.Role != UserRole.Seller && user.Profile?.Role != UserRole.Mall)
                {
                    throw new UnauthorizedAccessException("Only sellers and malls are allowed to submit appeals.");
                }
            }

            if (path.Equals("/api/Support/order-complaint", StringComparison.OrdinalIgnoreCase) &&
                path.EndsWith("/shipper-complaint", StringComparison.OrdinalIgnoreCase) &&
                (method == "POST"))
            {
                if (user.Profile?.Role != UserRole.Customer)
                {
                    throw new UnauthorizedAccessException("Only customers can submit order complaints.");
                }
            }
            // Phân quyền: Notification cho phép tất cả các Role (chỉ cần đăng nhập)
            if (path.StartsWith("/api/Notification", StringComparison.OrdinalIgnoreCase))
            {
                if (user.Profile == null)
                {
                    throw new UnauthorizedAccessException("User profile is required to access notifications.");
                }
            }

            if (path.StartsWith("/api/FlashSale", StringComparison.OrdinalIgnoreCase) &&
                !path.Equals("/api/FlashSale/register", StringComparison.OrdinalIgnoreCase) &&
                (method == "POST" || method == "PUT" || method == "DELETE"))
            {
                if (user.Profile?.Role != UserRole.Admin)
                {
                    throw new UnauthorizedAccessException("Only admin can manage flash sales.");
                }
            }

            if (path.Equals("/api/FlashSale/register", StringComparison.OrdinalIgnoreCase) &&
                method == "POST")
            {
                if (user.Profile?.Role != UserRole.Seller && user.Profile?.Role != UserRole.Mall)
                {
                    throw new UnauthorizedAccessException("Only sellers can register products for flash sales.");
                }
            }

            if (path.Equals("/api/Chat/sessions", StringComparison.OrdinalIgnoreCase) &&
                method == "POST")
            {
                if (user.Profile?.Role != UserRole.Customer &&
                    user.Profile?.Role != UserRole.Seller &&
                    user.Profile?.Role != UserRole.Mall &&
                    user.Profile?.Role != UserRole.Shipper)
                {
                    throw new UnauthorizedAccessException("Only customers, sellers, and shippers can start a chat session.");
                }
            }

            if (path.StartsWith("/api/Faq", StringComparison.OrdinalIgnoreCase) &&
                (method == "POST" || method == "PUT" || method == "DELETE"))
            {
                if (user.Profile?.Role != ShoppingFood.Domain.Enums.UserRole.Admin)
                {
                    throw new UnauthorizedAccessException("Only admin can perform this action.");
                }
            }

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
