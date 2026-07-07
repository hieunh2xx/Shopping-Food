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

            // 2. Nạp danh sách RolePermissions mặc định nếu DB phân quyền rỗng
            if (!await context.RolePermissions.AnyAsync())
            {
                var rolePermissionsToAdd = new List<RolePermission>();
                var allEndpoints = await context.ApiEndpoints.ToListAsync();

                foreach (var ep in allEndpoints)
                {
                    var roles = GetDefaultRolesForEndpoint(ep.Method, ep.Path);
                    foreach (var role in roles)
                    {
                        rolePermissionsToAdd.Add(new RolePermission
                        {
                            Id = Guid.NewGuid(),
                            Role = role,
                            ApiEndpointId = ep.Id
                        });
                    }
                }

                if (rolePermissionsToAdd.Any())
                {
                    await context.RolePermissions.AddRangeAsync(rolePermissionsToAdd);
                    await context.SaveChangesAsync();
                    Console.WriteLine($"[ApiEndpointSeeder] Đã nạp {rolePermissionsToAdd.Count} RolePermissions mặc định.");
                }
            }
        }

        private static List<UserRole> GetDefaultRolesForEndpoint(string method, string path)
        {
            var roles = new HashSet<UserRole>();
            roles.Add(UserRole.Admin); // Admin có full quyền

            path = path.ToLower();
            method = method.ToUpper();

            // Product & Topping
            if ((path.Contains("/api/product") || path.Contains("/api/topping")) && 
                !path.Equals("/api/product/report") && 
                !path.Equals("/api/product/review") &&
                !path.Contains("/review/") &&
                (method == "POST" || method == "PUT" || method == "DELETE" || method == "PATCH"))
            {
                roles.Add(UserRole.Seller);
            }
            if ((path.Equals("/api/product/report") || path.Equals("/api/product/review")) && method == "POST")
            {
                roles.Add(UserRole.Customer);
            }
            if (path.Contains("/api/product") && path.Contains("/review/") && (path.EndsWith("/reply") || path.EndsWith("/report")) && method == "POST")
            {
                roles.Add(UserRole.Seller);
                roles.Add(UserRole.Mall);
            }

            // MenuCategory
            if (path.Contains("/api/menucategory") && (method == "POST" || method == "PUT" || method == "DELETE" || method == "PATCH"))
            {
                roles.Add(UserRole.Seller);
            }

            // Shipper
            if (path.StartsWith("/api/shipper") && !path.Equals("/api/shipper/review"))
            {
                roles.Add(UserRole.Shipper);
            }
            if (path.Equals("/api/shipper/review") && method == "POST")
            {
                roles.Add(UserRole.Customer);
            }

            // Restaurant
            if (path.Contains("/api/restaurant/favorite") || path.Contains("/api/restaurant/favorites"))
            {
                roles.Add(UserRole.Customer);
            }
            else if (path.StartsWith("/api/restaurant") && (method == "PUT" || method == "POST" || method == "DELETE"))
            {
                roles.Add(UserRole.Seller);
            }
            else if (path.Equals("/api/restaurant/dashboardstats") && method == "GET")
            {
                roles.Add(UserRole.Seller);
                roles.Add(UserRole.Mall);
            }

            // Order
            if ((path.Equals("/api/order/accept") || path.Equals("/api/order/reject") || path.Equals("/api/order/prepare") || path.Equals("/api/order/waiting-for-shipper") || path.Equals("/api/order/seller-cancel")) && method == "POST")
            {
                roles.Add(UserRole.Seller);
            }
            if (path.StartsWith("/api/order") && method == "GET")
            {
                roles.Add(UserRole.Customer);
                roles.Add(UserRole.Seller);
                roles.Add(UserRole.Shipper);
            }
            if (path.StartsWith("/api/order/cancel") || path.StartsWith("/api/order/checkout"))
            {
                roles.Add(UserRole.Customer);
            }

            // Coordinator
            if (path.Contains("/api/coordinator/"))
            {
                roles.Add(UserRole.Coordinator);
            }

            // Discount & Promotion
            if (path.StartsWith("/api/discount") || path.StartsWith("/api/promotion"))
            {
                if (method == "POST" && path.Equals("/api/discount/save")) { roles.Add(UserRole.Customer); }
                else if (method == "GET" && path.Equals("/api/discount/stats")) { roles.Add(UserRole.Seller); roles.Add(UserRole.Mall); }
                else if (method == "POST" || method == "PUT" || method == "DELETE" || method == "PATCH") { roles.Add(UserRole.Seller); roles.Add(UserRole.Mall); }
                else { roles.Add(UserRole.Customer); roles.Add(UserRole.Seller); roles.Add(UserRole.Mall); }
            }

            // Support
            if (path.StartsWith("/api/support/appeal"))
            {
                roles.Add(UserRole.Seller);
                roles.Add(UserRole.Mall);
            }
            if (path.Contains("/api/support/order-complaint") && path.EndsWith("/shipper-complaint") && method == "POST")
            {
                roles.Add(UserRole.Customer);
            }

            // Public & Shared
            if (path.StartsWith("/api/cart") || path.StartsWith("/api/notification") || path.StartsWith("/api/user") || path.StartsWith("/api/chat"))
            {
                roles.Add(UserRole.Customer);
                roles.Add(UserRole.Seller);
                roles.Add(UserRole.Shipper);
                roles.Add(UserRole.Mall);
                roles.Add(UserRole.Coordinator);
            }

            // FlashSale
            if (path.StartsWith("/api/flashsale"))
            {
                if (path.Equals("/api/flashsale/register") && method == "POST")
                {
                    roles.Add(UserRole.Seller);
                    roles.Add(UserRole.Mall);
                }
                else if (method == "POST" || method == "PUT" || method == "DELETE")
                {
                    // Admin only
                }
                else
                {
                    // GET endpoints are for everyone
                    roles.Add(UserRole.Customer);
                    roles.Add(UserRole.Seller);
                    roles.Add(UserRole.Mall);
                    roles.Add(UserRole.Shipper);
                }
            }

            return roles.ToList();
        }
    }
}
