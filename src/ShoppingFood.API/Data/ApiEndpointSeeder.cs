using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using Microsoft.Extensions.DependencyInjection;
using ShoppingFood.Domain.Enums;
using System.Collections.Generic;

namespace ShoppingFood.API.Data
{
    public static class ApiEndpointSeeder
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            using var scope = services.CreateScope();
            var provider = scope.ServiceProvider.GetRequiredService<IActionDescriptorCollectionProvider>();
            var context = scope.ServiceProvider.GetRequiredService<ShoppingFoodContext>();

            var routes = provider.ActionDescriptors.Items;
            
            // 1. Nạp danh sách ApiEndpoints
            var existingEndpoints = await context.ApiEndpoints.ToDictionaryAsync(e => e.Method + ":" + e.Path);
            var endpointsToAdd = new List<ApiEndpoint>();

            foreach (var route in routes)
            {
                var methodMetadata = route.EndpointMetadata.OfType<HttpMethodMetadata>().FirstOrDefault();
                var method = methodMetadata?.HttpMethods.FirstOrDefault();
                if (method == null) continue;

                var path = route.AttributeRouteInfo?.Template;
                if (string.IsNullOrEmpty(path)) continue;

                if (!path.StartsWith("/"))
                {
                    path = "/" + path;
                }

                var controllerActionDescriptor = route as Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor;
                var module = controllerActionDescriptor?.ControllerName ?? "Common";
                var name = controllerActionDescriptor?.ActionName ?? "Action";

                var key = $"{method}:{path}";
                
                if (!existingEndpoints.ContainsKey(key))
                {
                    endpointsToAdd.Add(new ApiEndpoint
                    {
                        Id = Guid.NewGuid(),
                        Method = method,
                        Path = path,
                        Module = module,
                        Name = name,
                        IsPublished = true,
                        CreatedAt = DateTime.UtcNow
                    });
                    
                    existingEndpoints[key] = new ApiEndpoint();
                }
            }

            if (endpointsToAdd.Any())
            {
                await context.ApiEndpoints.AddRangeAsync(endpointsToAdd);
                await context.SaveChangesAsync();
                Console.WriteLine($"[ApiEndpointSeeder] Đã tự động nạp {endpointsToAdd.Count} API Endpoints mới vào DB.");
            }

            // 2. Đồng bộ RolePermissions mặc định (thêm thiếu, không xóa quyền custom)
            var rolePermissionsToAdd = new List<RolePermission>();
            var allEndpoints = await context.ApiEndpoints.ToListAsync();
            var existingRolePerms = await context.RolePermissions
                .Select(rp => new { rp.ApiEndpointId, rp.Role })
                .ToListAsync();
            var existingSet = existingRolePerms
                .Select(rp => $"{rp.ApiEndpointId}:{rp.Role}")
                .ToHashSet();

            foreach (var ep in allEndpoints)
            {
                var roles = GetDefaultRolesForEndpoint(ep.Method, ep.Path);
                foreach (var role in roles)
                {
                    var key = $"{ep.Id}:{role}";
                    if (existingSet.Contains(key)) continue;

                    rolePermissionsToAdd.Add(new RolePermission
                    {
                        Id = Guid.NewGuid(),
                        Role = role,
                        ApiEndpointId = ep.Id,
                        CreatedAt = DateTime.UtcNow
                    });
                    existingSet.Add(key);
                }
            }

            if (rolePermissionsToAdd.Any())
            {
                await context.RolePermissions.AddRangeAsync(rolePermissionsToAdd);
                await context.SaveChangesAsync();
                Console.WriteLine($"[ApiEndpointSeeder] Đã bổ sung {rolePermissionsToAdd.Count} RolePermissions mặc định còn thiếu.");
            }
        }

        private record PermissionRule(string Method, string PathPattern, UserRole[] Roles);

        private static readonly List<PermissionRule> PermissionTable = new()
        {
            // === User ===
            new("POST", "/api/user/login", Array.Empty<UserRole>()),
            new("POST", "/api/user/register", Array.Empty<UserRole>()),
            new("POST", "/api/user/registerseller", Array.Empty<UserRole>()),
            new("POST", "/api/user/logingoogle", Array.Empty<UserRole>()),
            new("POST", "/api/user/loginmicrosoft", Array.Empty<UserRole>()),
            new("GET", "/api/user/profile", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper, UserRole.Coordinator }),
            new("POST", "/api/user/register-shipper", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall }),
            new("GET", "/api/user/sellerapplication/status", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall }),
            new("PUT", "/api/user/sellerapplication", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall }),
            new("PUT", "/api/user/update-shipper-application", new[] { UserRole.Customer, UserRole.Shipper }),
            new("GET", "/api/user/my-applications", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper }),
            new("PUT", "/api/user/changepassword", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper, UserRole.Coordinator }),
            new("POST", "/api/user/upgradetomall", new[] { UserRole.Seller }),
            
            // === UserAddress ===
            new("*", "/api/useraddress", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper }),
            new("*", "/api/useraddress/", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper }),
            
            // === Order ===
            new("GET", "/api/order/myorders", new[] { UserRole.Customer }),
            new("GET", "/api/order/recent-items", new[] { UserRole.Customer }),
            new("GET", "/api/order/restaurantorders", new[] { UserRole.Seller, UserRole.Mall }),
            new("GET", "/api/order/details/", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper, UserRole.Coordinator }),
            new("POST", "/api/order/checkout", new[] { UserRole.Customer }),
            new("POST", "/api/order/checkout/sent-otp", new[] { UserRole.Customer }),
            new("PUT", "/api/order/update", new[] { UserRole.Customer }),
            new("PUT", "/api/order/cancel", new[] { UserRole.Customer }),
            new("POST", "/api/order/reorder", new[] { UserRole.Customer }),
            new("POST", "/api/order/accept", new[] { UserRole.Seller, UserRole.Mall }),
            new("POST", "/api/order/reject", new[] { UserRole.Seller, UserRole.Mall }),
            new("POST", "/api/order/prepare", new[] { UserRole.Seller, UserRole.Mall }),
            new("POST", "/api/order/waiting-for-shipper", new[] { UserRole.Seller, UserRole.Mall }),
            new("POST", "/api/order/seller-cancel", new[] { UserRole.Seller, UserRole.Mall }),
            new("POST", "/api/order/", new[] { UserRole.Seller, UserRole.Mall }),
            new("GET", "/api/order/", new[] { UserRole.Customer, UserRole.Seller, UserRole.Shipper }),
            
            // === Product ===
            new("GET", "/api/product", Array.Empty<UserRole>()),
            new("GET", "/api/product/search", Array.Empty<UserRole>()),
            new("GET", "/api/product/bestsellers", Array.Empty<UserRole>()),
            new("GET", "/api/product/categories", Array.Empty<UserRole>()),
            new("GET", "/api/product/recommendations", new[] { UserRole.Customer }),
            new("GET", "/api/product/seller/reviews", new[] { UserRole.Seller, UserRole.Mall }),
            new("GET", "/api/product/", Array.Empty<UserRole>()),
            new("POST", "/api/product", new[] { UserRole.Seller, UserRole.Mall }),
            new("PUT", "/api/product/", new[] { UserRole.Seller, UserRole.Mall }),
            new("DELETE", "/api/product/", new[] { UserRole.Seller, UserRole.Mall }),
            new("PATCH", "/api/product/stockstatus/", new[] { UserRole.Seller, UserRole.Mall }),
            new("PATCH", "/api/product/visibility/", new[] { UserRole.Seller, UserRole.Mall }),
            new("PATCH", "/api/product/timeavailability/", new[] { UserRole.Seller, UserRole.Mall }),
            new("POST", "/api/product/report", new[] { UserRole.Customer }),
            new("POST", "/api/product/review", new[] { UserRole.Customer }),
            new("POST", "/api/product/review/", new[] { UserRole.Customer }),
            new("*", "/api/product/review/", new[] { UserRole.Seller, UserRole.Mall }),
            
            // === Shipper ===
            new("POST", "/api/shipper/toggle-online", new[] { UserRole.Shipper }),
            new("POST", "/api/shipper/accept-offer", new[] { UserRole.Shipper }),
            new("POST", "/api/shipper/confirm-arrived", new[] { UserRole.Shipper }),
            new("POST", "/api/shipper/confirm-picked-up", new[] { UserRole.Shipper }),
            new("POST", "/api/shipper/confirm-delivered", new[] { UserRole.Shipper }),
            new("POST", "/api/shipper/confirm-failed", new[] { UserRole.Shipper }),
            new("POST", "/api/shipper/location", new[] { UserRole.Shipper }),
            new("GET", "/api/shipper/income-report", new[] { UserRole.Shipper }),
            new("GET", "/api/shipper/schedule-area", new[] { UserRole.Shipper }),
            new("PUT", "/api/shipper/schedule-area", new[] { UserRole.Shipper }),
            new("GET", "/api/shipper/available-offers", new[] { UserRole.Shipper }),
            new("POST", "/api/shipper/reject-offers", new[] { UserRole.Shipper }),
            new("POST", "/api/shipper/review", new[] { UserRole.Customer }),
            new("GET", "/api/shipper/reputationhistory", new[] { UserRole.Shipper }),
            new("*", "/api/shipper/", new[] { UserRole.Shipper }),
            
            // === Coordinator ===
            new("*", "/api/coordinator/", new[] { UserRole.Coordinator, UserRole.Admin }),
            
            // === Restaurant ===
            new("GET", "/api/restaurant", Array.Empty<UserRole>()),
            new("GET", "/api/restaurant/nearby", Array.Empty<UserRole>()),
            new("GET", "/api/restaurant/dashboardstats", new[] { UserRole.Seller, UserRole.Mall }),
            new("GET", "/api/restaurant/favorites", new[] { UserRole.Customer }),
            new("POST", "/api/restaurant/", new[] { UserRole.Customer }),
            new("DELETE", "/api/restaurant/", new[] { UserRole.Customer }),
            new("PUT", "/api/restaurant/basic-info", new[] { UserRole.Seller, UserRole.Mall }),
            new("PUT", "/api/restaurant/operating-hours", new[] { UserRole.Seller, UserRole.Mall }),
            new("PUT", "/api/restaurant/status", new[] { UserRole.Seller, UserRole.Mall }),
            new("PUT", "/api/restaurant/delivery-config", new[] { UserRole.Seller, UserRole.Mall }),
            new("GET", "/api/restaurant/", Array.Empty<UserRole>()),
            new("*", "/api/restaurant/", new[] { UserRole.Seller, UserRole.Mall }),
            
            // === Discount ===
            new("POST", "/api/discount/save", new[] { UserRole.Customer }),
            new("GET", "/api/discount/stats", new[] { UserRole.Seller, UserRole.Mall }),
            new("GET", "/api/discount", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall }),
            new("*", "/api/discount/", new[] { UserRole.Seller, UserRole.Mall }),
            
            // === Promotion ===
            // GET is public (home Buy X Get Y); write ops stay seller/mall
            new("GET", "/api/promotion", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper }),
            new("POST", "/api/promotion", new[] { UserRole.Seller, UserRole.Mall }),
            new("*", "/api/promotion/", new[] { UserRole.Seller, UserRole.Mall }),
            
            // === FlashSale ===
            new("POST", "/api/flashsale/register", new[] { UserRole.Seller, UserRole.Mall }),
            new("GET", "/api/flashsale", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper }),
            new("GET", "/api/flashsale/", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper }),
            new("*", "/api/flashsale/flash-sales", new[] { UserRole.Admin }),
            new("*", "/api/flashsale/flash-sales/", new[] { UserRole.Admin }),
            new("*", "/api/flashsale/", new[] { UserRole.Admin }),
            
            // === LoyaltyPoint ===
            new("GET", "/api/loyaltypoint", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper }),
            new("GET", "/api/loyaltypoint/tier-configs", new[] { UserRole.Admin }),
            new("POST", "/api/loyaltypoint/tier-configs", new[] { UserRole.Admin }),
            new("POST", "/api/loyaltypoint/evaluate-tiers", new[] { UserRole.Admin }),
            new("PUT", "/api/loyaltypoint/adjust-user-tier", new[] { UserRole.Admin }),
            new("*", "/api/loyaltypoint/gifts", new[] { UserRole.Customer }),
            new("*", "/api/loyaltypoint/redeem", new[] { UserRole.Customer }),
            
            // === Support ===
            new("POST", "/api/support/appeal", new[] { UserRole.Seller, UserRole.Mall }),
            new("POST", "/api/support/order-complaint", new[] { UserRole.Customer }),
            new("POST", "/api/support/shipper-complaint", new[] { UserRole.Customer }),
            new("*", "/api/support/", new[] { UserRole.Customer }),
            
            // === Topping ===
            new("GET", "/api/topping", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper }),
            new("GET", "/api/topping/", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper }),
            new("*", "/api/topping", new[] { UserRole.Seller, UserRole.Mall }),
            new("*", "/api/topping/", new[] { UserRole.Seller, UserRole.Mall }),

            // === MenuCategory ===
            new("GET", "/api/menucategory", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper }),
            new("GET", "/api/menucategory/", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper }),
            new("*", "/api/menucategory", new[] { UserRole.Seller, UserRole.Mall }),
            new("*", "/api/menucategory/", new[] { UserRole.Seller, UserRole.Mall }),
            
            // === Payment ===
            new("*", "/api/payment/wallet", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper }),
            new("*", "/api/payment/transactions", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper }),
            new("POST", "/api/payment/withdrawals/approve", new[] { UserRole.Admin }),
            new("*", "/api/payment/withdraw", new[] { UserRole.Seller, UserRole.Mall, UserRole.Shipper }),
            new("*", "/api/payment/withdrawals", new[] { UserRole.Seller, UserRole.Mall, UserRole.Shipper }),
            new("*", "/api/payment/reconciliation", new[] { UserRole.Admin, UserRole.Coordinator }),
            new("*", "/api/payment/", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper }),
            
            // === System ===
            new("GET", "/api/system/legal", Array.Empty<UserRole>()),
            new("GET", "/api/system/global-menu-category", Array.Empty<UserRole>()),
            new("GET", "/api/system/delivery-settings", Array.Empty<UserRole>()),
            new("GET", "/api/system/action-logs", new[] { UserRole.Admin }),
            new("GET", "/api/system/error-logs", new[] { UserRole.Admin }),
            
            // === FAQ ===
            new("GET", "/api/faq", Array.Empty<UserRole>()),
            new("GET", "/api/faq/", Array.Empty<UserRole>()),
            new("*", "/api/faq", new[] { UserRole.Admin }),
            new("*", "/api/faq/", new[] { UserRole.Admin }),
            
            // === Cart ===
            new("*", "/api/cart", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper }),
            new("*", "/api/cart/", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper }),
            
            // === Notification ===
            new("*", "/api/notification", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper, UserRole.Coordinator, UserRole.Admin }),
            new("*", "/api/notification/", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper, UserRole.Coordinator, UserRole.Admin }),
            
            // === Chat ===
            new("*", "/api/chat", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper, UserRole.Coordinator }),
            new("*", "/api/chat/", new[] { UserRole.Customer, UserRole.Seller, UserRole.Mall, UserRole.Shipper, UserRole.Coordinator }),
            
            // === Admin Catch-all ===
            new("*", "/api/admin/", new[] { UserRole.Admin })
        };

        private static List<UserRole> GetDefaultRolesForEndpoint(string method, string path)
        {
            path = path.ToLower();
            method = method.ToUpper();

            int maxScore = -1;
            PermissionRule? bestMatch = null;

            foreach (var rule in PermissionTable)
            {
                bool methodExact = rule.Method == method;
                bool methodAny = rule.Method == "*";
                if (!methodExact && !methodAny) continue;

                bool isPrefix = rule.PathPattern.EndsWith("/");
                bool pathExact = !isPrefix && path == rule.PathPattern;
                bool pathPrefix = isPrefix && path.StartsWith(rule.PathPattern);

                if (!pathExact && !pathPrefix) continue;

                int score = 0;
                if (pathExact) score += 1000;
                if (pathPrefix) score += rule.PathPattern.Length; // Longer prefix wins
                if (methodExact) score += 100;

                if (score > maxScore)
                {
                    maxScore = score;
                    bestMatch = rule;
                }
            }

            var roles = new HashSet<UserRole>();
            roles.Add(UserRole.Admin); // Admin always has full access

            if (bestMatch != null)
            {
                foreach (var role in bestMatch.Roles)
                {
                    roles.Add(role);
                }
            }
            
            return roles.ToList();
        }
    }
}
