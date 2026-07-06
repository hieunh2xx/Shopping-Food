using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;

namespace ShoppingFood.API.Data
{
    public static class E2eDataSeeder
    {
        private static readonly string[] TrustedIps = ["127.0.0.1", "::1", "0.0.0.1", "unknown"];

        public static async Task SeedAsync(ShoppingFoodContext db)
        {
            await SeedUserAsync(db, "admin", "Admin@123", "System Admin", "admin@test.com", "0900000000", UserRole.Admin);
            await SeedUserAsync(db, "testcustomer", "Test@123", "Test Customer", "testcustomer@test.com", "0900000001", UserRole.Customer);
            await SeedSellerAsync(db);
            await SeedShipperAsync(db);
            await SeedUserAsync(db, "testcoord", "Test@123", "Test Coordinator", "testcoord@test.com", "0900000004", UserRole.Coordinator);

            if (!await db.PlatformFinanceConfigs.AnyAsync())
            {
                db.PlatformFinanceConfigs.Add(new PlatformFinanceConfig { Id = Guid.NewGuid() });
            }

            await db.SaveChangesAsync();
            Console.WriteLine("E2E test accounts seeded successfully.");

            await SeedSampleProductAsync(db);
        }

        private static async Task SeedSampleProductAsync(ShoppingFoodContext db)
        {
            var restaurant = await db.RestaurantProfiles.FirstOrDefaultAsync(r => r.RestaurantName == "Test Restaurant E2E");
            if (restaurant == null) return;

            var hasProduct = await db.Products.AnyAsync(p => p.RestaurantId == restaurant.Id && p.ItemName == "Phở Bò E2E");
            if (hasProduct) return;

            var category = await db.MenuCategories.FirstOrDefaultAsync(c => c.RestaurantId == restaurant.Id);
            if (category == null)
            {
                category = new MenuCategory
                {
                    Id = Guid.NewGuid(),
                    RestaurantId = restaurant.Id,
                    Title = "Món chính",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                db.MenuCategories.Add(category);
            }

            db.Products.Add(new Product
            {
                Id = Guid.NewGuid(),
                RestaurantId = restaurant.Id,
                CategoryId = category.Id,
                ItemName = "Phở Bò E2E",
                Description = "Món test cho E2E",
                Price = 65000,
                StockStatus = StockStatus.InStock,
                Status = ProductStatus.Approved,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }

        private static async Task SeedUserAsync(
            ShoppingFoodContext db, string username, string password, string fullName,
            string email, string phone, UserRole role)
        {
            var user = await db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.UserName == username);
            if (user == null)
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    UserName = username,
                    Email = email,
                    Phone = phone,
                    PasswordHash = HashPassword(password),
                    Status = UserStatus.Active,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Profile = new UserProfile
                    {
                        Id = Guid.NewGuid(),
                        FullName = fullName,
                        Role = role,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                };
                user.Profile.UserAccountId = user.Id;
                db.Users.Add(user);
            }
            else if (user.Profile != null && user.Profile.Role != role)
            {
                user.Profile.Role = role;
                user.Profile.UpdatedAt = DateTime.UtcNow;
            }

            await EnsureTrustedDevicesAsync(db, user.Id);
        }

        private static async Task SeedSellerAsync(ShoppingFoodContext db)
        {
            const string username = "testseller";
            var user = await db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.UserName == username);
            if (user == null)
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    UserName = username,
                    Email = "testseller@test.com",
                    Phone = "0900000002",
                    PasswordHash = HashPassword("Test@123"),
                    Status = UserStatus.Active,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Profile = new UserProfile
                    {
                        Id = Guid.NewGuid(),
                        FullName = "Test Seller",
                        Role = UserRole.Seller,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                };
                user.Profile.UserAccountId = user.Id;
                db.Users.Add(user);
                await db.SaveChangesAsync();
            }
            else if (user.Profile != null)
            {
                user.Profile.Role = UserRole.Seller;
            }

            var hasRestaurant = await db.RestaurantProfiles.AnyAsync(r => r.OwnerId == user!.Profile!.Id);
            if (!hasRestaurant)
            {
                var application = new SellerApplication
                {
                    Id = Guid.NewGuid(),
                    UserProfileId = user!.Profile!.Id,
                    BusinessName = "Test Restaurant E2E",
                    BusinessAddress = "123 Test Street, HCM",
                    ContactInfo = "0900000002",
                    BusinessLicenseUrl = "https://example.com/license.jpg",
                    ShopImageUrl = "https://example.com/shop.jpg",
                    Status = ApplicationStatus.Approved,
                    Type = ApplicationType.NewSeller,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                db.SellerApplications.Add(application);
                db.RestaurantProfiles.Add(new RestaurantProfile
                {
                    Id = Guid.NewGuid(),
                    SellerApplicationId = application.Id,
                    OwnerId = user.Profile.Id,
                    RestaurantName = application.BusinessName,
                    Address = application.BusinessAddress,
                    Phone = application.ContactInfo,
                    Email = user.Email ?? "testseller@test.com",
                    Status = RestaurantStatus.Active,
                    ShippingFee = 15000,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            await EnsureTrustedDevicesAsync(db, user!.Id);
        }

        private static async Task SeedShipperAsync(ShoppingFoodContext db)
        {
            const string username = "testshipper";
            var user = await db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.UserName == username);
            if (user == null)
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    UserName = username,
                    Email = "testshipper@test.com",
                    Phone = "0900000003",
                    PasswordHash = HashPassword("Test@123"),
                    Status = UserStatus.Active,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Profile = new UserProfile
                    {
                        Id = Guid.NewGuid(),
                        FullName = "Test Shipper",
                        Role = UserRole.Shipper,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                };
                user.Profile.UserAccountId = user.Id;
                db.Users.Add(user);
                await db.SaveChangesAsync();
            }
            else if (user.Profile != null)
            {
                user.Profile.Role = UserRole.Shipper;
            }

            var hasProfile = await db.ShipperProfiles.AnyAsync(s => s.UserProfileId == user!.Profile!.Id);
            if (!hasProfile)
            {
                var application = new ShipperApplication
                {
                    Id = Guid.NewGuid(),
                    UserProfileId = user!.Profile!.Id,
                    IdentityCardNumber = "123456789012",
                    IdentityCardFrontUrl = "https://example.com/id-front.jpg",
                    IdentityCardBackUrl = "https://example.com/id-back.jpg",
                    VehicleType = VehicleType.Motorcycle,
                    VehiclePlateNumber = "59A-12345",
                    DriverLicenseUrl = "https://example.com/license.jpg",
                    VehicleRegistrationUrl = "https://example.com/reg.jpg",
                    Status = ApplicationStatus.Approved,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                db.ShipperApplications.Add(application);
                db.ShipperProfiles.Add(new ShipperProfile
                {
                    Id = Guid.NewGuid(),
                    UserProfileId = user.Profile.Id,
                    ShipperApplicationId = application.Id,
                    VehicleType = VehicleType.Motorcycle,
                    VehiclePlateNumber = "59A-12345",
                    Status = UserStatus.Active,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            await EnsureTrustedDevicesAsync(db, user!.Id);
        }

        private static async Task EnsureTrustedDevicesAsync(ShoppingFoodContext db, Guid userId)
        {
            foreach (var ip in TrustedIps)
            {
                var exists = await db.TrustedDevices.AnyAsync(t => t.UserAccountId == userId && t.IpAddress == ip);
                if (!exists)
                {
                    db.TrustedDevices.Add(new TrustedDevice
                    {
                        Id = Guid.NewGuid(),
                        UserAccountId = userId,
                        IpAddress = ip,
                        TrustedAt = DateTime.UtcNow,
                        ExpiresAt = DateTime.UtcNow.AddYears(1)
                    });
                }
            }
        }

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            return Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes(password)));
        }
    }
}
