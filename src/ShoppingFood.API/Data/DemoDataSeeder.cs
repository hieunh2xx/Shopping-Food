using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;

namespace ShoppingFood.API.Data;

/// <summary>
/// Seeds rich demo data for screenshots / walkthrough (food images, orders, FAQ, loyalty).
/// Idempotent — safe to run on every Development startup.
/// </summary>
public static class DemoDataSeeder
{
    private const string DemoMarker = "[ReportDemo]";

    private static readonly (string Name, string Description, decimal Price, string ImageUrl)[] DemoProducts =
    [
        ("Phở Bò Đặc Biệt", "Phở bò tái nạm, nước dùng ninh 12 giờ", 65000,
            "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&h=600&fit=crop&q=80"),
        ("Bún Chả Hà Nội", "Thịt nướng than hoa, nước mắm chua ngọt", 55000,
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&q=80"),
        ("Cơm Tấm Sườn Bì", "Sườn nướng, bì, chả, trứng ốp la", 48000,
            "https://images.unsplash.com/photo-1603133872876-684f208fb84b?w=800&h=600&fit=crop&q=80"),
        ("Pizza Margherita", "Phô mai mozzarella, cà chua tươi, húng quế", 89000,
            "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=600&fit=crop&q=80"),
        ("Burger Classic", "Thịt bò Angus, phô mai cheddar, rau tươi", 75000,
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop&q=80"),
        ("Sushi Set 8 miếng", "Cá hồi, cá ngừ, tôm tươi", 120000,
            "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop&q=80"),
        ("Trà Sữa Trân Châu", "Trà sữa đài loan, trân châu đen dai giòn", 35000,
            "https://images.unsplash.com/photo-1525385133511-35d8a0a1bc12?w=800&h=600&fit=crop&q=80"),
        ("Bánh Mì Thịt Nướng", "Bánh mì giòn, thịt nướng, pate, rau thơm", 32000,
            "https://images.unsplash.com/photo-1559305616-3f99c5667f0f?w=800&h=600&fit=crop&q=80"),
        ("Gà Rán Giòn Cay", "4 miếng gà giòn, khoai tây chiên", 68000,
            "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&h=600&fit=crop&q=80"),
        ("Salad Caesar", "Rau xà lách, gà nướng, sốt Caesar", 52000,
            "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop&q=80"),
        ("Pasta Carbonara", "Mì Ý sốt kem, thịt xông khói, phô mai", 78000,
            "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop&q=80"),
        ("Tiramisu", "Bánh ngọt Ý truyền thống", 45000,
            "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop&q=80"),
    ];

    private static readonly (string Name, string ImageUrl)[] GlobalCategories =
    [
        ("Món Việt", "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop&q=80"),
        ("Fast Food", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&q=80"),
        ("Đồ uống", "https://images.unsplash.com/photo-1525385133511-35d8a0a1bc12?w=400&h=300&fit=crop&q=80"),
        ("Tráng miệng", "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop&q=80"),
        ("Healthy", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&q=80"),
    ];

    private static readonly (string Question, string Answer)[] DemoFaqs =
    [
        ("Làm sao để đặt món trên UniEats?",
            "Chọn món → Thêm vào giỏ → Checkout → Chọn địa chỉ và phương thức thanh toán → Xác nhận đặt hàng."),
        ("UniEats hỗ trợ những hình thức thanh toán nào?",
            "COD (tiền mặt khi nhận hàng), Ví hệ thống, và chuyển khoản SePay QR."),
        ("Làm sao theo dõi đơn hàng?",
            "Mở biểu tượng giỏ hàng → tab Đơn hàng, hoặc vào Hồ sơ → Lịch sử đơn hàng."),
        ("Điểm thưởng tích lũy như thế nào?",
            "Sau mỗi đơn giao thành công, bạn nhận điểm theo hạng thành viên. Đổi điểm lấy voucher tại mục Điểm thưởng."),
        ("Tôi muốn trở thành đối tác nhà hàng?",
            "Vào Đăng ký bán hàng, điền hồ sơ và chờ Admin phê duyệt trong 1–3 ngày làm việc."),
        ("Shipper nhận đơn như thế nào?",
            "Bật trạng thái Online trên Dashboard, chấp nhận đề xuất giao hàng từ hệ thống hoặc điều phối viên."),
    ];

    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ShoppingFoodContext>();

        var sellerUser = await context.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.UserName == "testseller");
        if (sellerUser?.Profile == null)
        {
            Console.WriteLine("[DemoDataSeeder] Skip — testseller not found.");
            return;
        }

        var restaurant = await context.RestaurantProfiles
            .FirstOrDefaultAsync(r => r.OwnerId == sellerUser.Profile.Id);
        if (restaurant == null)
        {
            Console.WriteLine("[DemoDataSeeder] Skip — testseller restaurant not found.");
            return;
        }

        var customerUser = await context.Users.FirstOrDefaultAsync(u => u.UserName == "testcustomer");
        var shipperProfile = await context.ShipperProfiles
            .Include(s => s.UserProfile)
            .ThenInclude(p => p!.UserAccount)
            .FirstOrDefaultAsync(s => s.UserProfile!.UserAccount!.UserName == "testshipper");

        await UpsertRestaurantBrandingAsync(context, restaurant);
        var category = await EnsureMenuCategoryAsync(context, restaurant.Id);
        var products = await UpsertDemoProductsAsync(context, restaurant.Id, category.Id);
        await UpsertAllMissingProductImagesAsync(context);
        await UpsertGlobalCategoriesAsync(context);
        await UpsertFaqsAsync(context);
        await UpsertCustomerWalletAndLoyaltyAsync(context, customerUser);
        await UpsertDemoOrdersAsync(context, customerUser, shipperProfile, products, restaurant);

        await context.SaveChangesAsync();
        Console.WriteLine("[DemoDataSeeder] Demo data ready for screenshots.");
    }

    private static async Task UpsertRestaurantBrandingAsync(ShoppingFoodContext context, RestaurantProfile restaurant)
    {
        restaurant.LogoUrl =
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop&q=80";
        restaurant.BannerUrl =
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=400&fit=crop&q=80";
        restaurant.AverageRating = 4.8;
        restaurant.ReviewCount = 256;
        restaurant.IsVerified = true;
        restaurant.Latitude ??= 21.0285;
        restaurant.Longitude ??= 105.8542;
        restaurant.OpeningTime ??= TimeSpan.FromHours(7);
        restaurant.ClosingTime ??= TimeSpan.FromHours(22);
        restaurant.UpdatedAt = DateTime.UtcNow;

        // Brand other active restaurants for richer listing pages
        var others = await context.RestaurantProfiles
            .Where(r => r.Id != restaurant.Id && r.Status == RestaurantStatus.Active)
            .OrderBy(r => r.RestaurantName)
            .Take(5)
            .ToListAsync();
        var banners = new[]
        {
            "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=400&fit=crop&q=80",
            "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=400&fit=crop&q=80",
            "https://images.unsplash.com/photo-1466978913421-0ad46801ac98?w=800&h=400&fit=crop&q=80",
        };
        for (var i = 0; i < others.Count; i++)
        {
            others[i].LogoUrl ??=
                "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop&q=80";
            others[i].BannerUrl = banners[i % banners.Length];
            others[i].AverageRating = Math.Max(others[i].AverageRating, 4.2 + i * 0.1);
            others[i].ReviewCount = Math.Max(others[i].ReviewCount, 50 + i * 20);
            others[i].UpdatedAt = DateTime.UtcNow;
        }
    }

    private static async Task<MenuCategory> EnsureMenuCategoryAsync(ShoppingFoodContext context, Guid restaurantId)
    {
        var existing = await context.MenuCategories
            .FirstOrDefaultAsync(c => c.RestaurantId == restaurantId && c.Title == "Thực đơn nổi bật");
        if (existing != null) return existing;

        var category = new MenuCategory
        {
            Id = Guid.NewGuid(),
            RestaurantId = restaurantId,
            Title = "Thực đơn nổi bật",
            Description = "Các món best-seller cho demo",
            SortOrder = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        context.MenuCategories.Add(category);
        return category;
    }

    private static async Task<List<Product>> UpsertDemoProductsAsync(
        ShoppingFoodContext context,
        Guid restaurantId,
        Guid categoryId)
    {
        var result = new List<Product>();
        var now = DateTime.UtcNow;

        foreach (var demo in DemoProducts)
        {
            var product = await context.Products
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p =>
                    p.RestaurantId == restaurantId &&
                    p.ItemName == demo.Name &&
                    !p.IsDeleted);

            if (product == null)
            {
                product = new Product
                {
                    Id = Guid.NewGuid(),
                    RestaurantId = restaurantId,
                    CategoryId = categoryId,
                    ItemName = demo.Name,
                    Description = $"{DemoMarker} {demo.Description}",
                    Price = demo.Price,
                    StockStatus = StockStatus.InStock,
                    Status = ProductStatus.Approved,
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                context.Products.Add(product);
            }
            else
            {
                product.Description = $"{DemoMarker} {demo.Description}";
                product.Price = demo.Price;
                product.Status = ProductStatus.Approved;
                product.IsHidden = false;
                product.UpdatedAt = now;
            }

            var image = product.Images.FirstOrDefault();
            if (image == null)
            {
                context.ProductImages.Add(new ProductImage
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    ImageUrl = demo.ImageUrl,
                    IsPrimary = true,
                    CreatedAt = now,
                });
            }
            else
            {
                image.ImageUrl = demo.ImageUrl;
                image.IsPrimary = true;
            }

            result.Add(product);
        }

        // Approve any pending products for this restaurant (prettier catalog)
        var pending = await context.Products
            .Include(p => p.Images)
            .Where(p => p.RestaurantId == restaurantId && p.Status == ProductStatus.Pending)
            .ToListAsync();
        foreach (var p in pending)
        {
            p.Status = ProductStatus.Approved;
            p.UpdatedAt = now;
            if (!p.Images.Any())
            {
                context.ProductImages.Add(new ProductImage
                {
                    Id = Guid.NewGuid(),
                    ProductId = p.Id,
                    ImageUrl = DemoProducts[Random.Shared.Next(DemoProducts.Length)].ImageUrl,
                    IsPrimary = true,
                    CreatedAt = now,
                });
            }
            result.Add(p);
        }

        // Ensure every product in demo restaurant has a food photo
        var withoutImage = await context.Products
            .Include(p => p.Images)
            .Where(p => p.RestaurantId == restaurantId && !p.IsDeleted && !p.Images.Any())
            .ToListAsync();
        for (var i = 0; i < withoutImage.Count; i++)
        {
            var img = DemoProducts[i % DemoProducts.Length].ImageUrl;
            context.ProductImages.Add(new ProductImage
            {
                Id = Guid.NewGuid(),
                ProductId = withoutImage[i].Id,
                ImageUrl = img,
                IsPrimary = true,
                CreatedAt = now,
            });
        }

        return result.DistinctBy(p => p.Id).ToList();
    }

    private static async Task UpsertAllMissingProductImagesAsync(ShoppingFoodContext context)
    {
        var now = DateTime.UtcNow;
        var missing = await context.Products
            .Include(p => p.Images)
            .Where(p => !p.IsDeleted && !p.Images.Any())
            .ToListAsync();

        for (var i = 0; i < missing.Count; i++)
        {
            context.ProductImages.Add(new ProductImage
            {
                Id = Guid.NewGuid(),
                ProductId = missing[i].Id,
                ImageUrl = DemoProducts[i % DemoProducts.Length].ImageUrl,
                IsPrimary = true,
                CreatedAt = now,
            });
            missing[i].Status = ProductStatus.Approved;
            missing[i].UpdatedAt = now;
        }
    }

    private static async Task UpsertGlobalCategoriesAsync(ShoppingFoodContext context)
    {
        var existing = await context.GlobalMenuCategories.ToListAsync();
        var now = DateTime.UtcNow;

        foreach (var (name, imageUrl) in GlobalCategories)
        {
            var cat = existing.FirstOrDefault(c => c.Name == name);
            if (cat == null)
            {
                context.GlobalMenuCategories.Add(new GlobalMenuCategory
                {
                    Id = Guid.NewGuid(),
                    Name = name,
                    Description = $"{DemoMarker} Danh mục {name}",
                    ImageUrl = imageUrl,
                    SortOrder = existing.Count + 1,
                    IsHidden = false,
                    CreatedAt = now,
                    UpdatedAt = now,
                });
            }
            else
            {
                cat.ImageUrl = imageUrl;
                cat.IsHidden = false;
                cat.UpdatedAt = now;
            }
        }
    }

    private static async Task UpsertFaqsAsync(ShoppingFoodContext context)
    {
        if (await context.Faqs.CountAsync() >= DemoFaqs.Length) return;

        var now = DateTime.UtcNow;
        var order = 1;
        foreach (var (question, answer) in DemoFaqs)
        {
            if (await context.Faqs.AnyAsync(f => f.Question == question)) continue;
            context.Faqs.Add(new Faq
            {
                Id = Guid.NewGuid(),
                Question = question,
                Answer = answer,
                DisplayOrder = order++,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            });
        }
    }

    private static async Task UpsertCustomerWalletAndLoyaltyAsync(ShoppingFoodContext context, User? customerUser)
    {
        if (customerUser == null) return;
        var now = DateTime.UtcNow;

        var wallet = await context.Wallets
            .FirstOrDefaultAsync(w => w.OwnerType == WalletOwnerType.Customer && w.OwnerId == customerUser.Id);
        if (wallet == null)
        {
            context.Wallets.Add(new Wallet
            {
                Id = Guid.NewGuid(),
                OwnerType = WalletOwnerType.Customer,
                OwnerId = customerUser.Id,
                Balance = 250_000m,
                CreatedAt = now,
                UpdatedAt = now,
            });
        }
        else if (wallet.Balance < 100_000m)
        {
            wallet.Balance = 250_000m;
            wallet.UpdatedAt = now;
        }

        var loyalty = await context.LoyaltyPoints.FirstOrDefaultAsync(l => l.UserAccountId == customerUser.Id);
        if (loyalty == null)
        {
            context.LoyaltyPoints.Add(new LoyaltyPoint
            {
                UserAccountId = customerUser.Id,
                PointsBalance = 1250,
                TotalEarnedPoints = 3200,
                Tier = MemberTier.Silver,
                UpdatedAt = now,
            });
        }
        else
        {
            loyalty.PointsBalance = Math.Max(loyalty.PointsBalance, 1250);
            loyalty.TotalEarnedPoints = Math.Max(loyalty.TotalEarnedPoints, 3200);
            loyalty.Tier = MemberTier.Silver;
            loyalty.UpdatedAt = now;
        }
    }

    private static async Task UpsertDemoOrdersAsync(
        ShoppingFoodContext context,
        User? customerUser,
        ShipperProfile? shipperProfile,
        List<Product> products,
        RestaurantProfile restaurant)
    {
        if (customerUser == null || products.Count == 0) return;

        var demoOrderCount = await context.Orders
            .CountAsync(o => o.Note != null && o.Note.Contains(DemoMarker));
        if (demoOrderCount >= 8) return;

        var shipperId = shipperProfile?.Id;
        var statuses = new[]
        {
            OrderStatus.Pending,
            OrderStatus.Confirmed,
            OrderStatus.Preparing,
            OrderStatus.WaitingForShipper,
            OrderStatus.Shipping,
            OrderStatus.Delivered,
            OrderStatus.Delivered,
            OrderStatus.Cancelled,
        };

        var now = DateTime.UtcNow;
        for (var i = 0; i < statuses.Length; i++)
        {
            var product = products[i % products.Count];
            var qty = 1 + (i % 3);
            var subtotal = product.Price * qty;
            var shipping = restaurant.ShippingFee > 0 ? restaurant.ShippingFee : 15000m;
            var total = subtotal + shipping;
            var status = statuses[i];

            var order = new Order
            {
                Id = Guid.NewGuid(),
                UserAccountId = customerUser.Id,
                ShipperId = status is OrderStatus.Shipping or OrderStatus.Delivered ? shipperId : null,
                TotalAmount = total,
                ShippingFee = shipping,
                ItemsSubtotal = subtotal,
                SellerPayout = subtotal * 0.85m,
                PlatformCommission = subtotal * 0.15m,
                ShipperIncome = status is OrderStatus.Shipping or OrderStatus.Delivered ? 25000m : 0,
                DeliveryAddress = "123 Nguyễn Huệ, Quận 1, TP.HCM",
                ContactName = "Nguyễn Văn Demo",
                ContactPhone = "0901234567",
                Note = $"{DemoMarker} Demo order #{i + 1}",
                Status = status,
                PaymentMethod = PaymentMethod.COD,
                PaymentStatus = PaymentStatus.Paid,
                DeliveryLatitude = 10.7769,
                DeliveryLongitude = 106.7009,
                IpAddress = "127.0.0.1",
                CreatedAt = now.AddHours(-i * 3),
                UpdatedAt = now.AddHours(-i * 2),
            };

            if (status == OrderStatus.Cancelled)
            {
                order.RejectReason = "Khách hủy — demo data";
                order.PaymentStatus = PaymentStatus.Refunded;
            }

            context.Orders.Add(order);
            context.OrderItems.Add(new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                ProductId = product.Id,
                ItemName = product.ItemName,
                Quantity = qty,
                UnitPrice = product.Price,
                TotalPrice = subtotal,
            });
        }
    }
}
