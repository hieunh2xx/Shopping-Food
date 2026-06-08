using Microsoft.EntityFrameworkCore;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;

namespace ShoppingFood.Domain.Context
{
    public class ShoppingFoodContext : DbContext
    {
        public ShoppingFoodContext(DbContextOptions<ShoppingFoodContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<UserProfile> UserProfiles { get; set; } = null!;
        public DbSet<SellerApplication> SellerApplications { get; set; } = null!;
        public DbSet<RestaurantProfile> RestaurantProfiles { get; set; } = null!;
        public DbSet<Product> Products { get; set; } = null!;
        public DbSet<ProductImage> ProductImages { get; set; } = null!;
        public DbSet<MenuCategory> MenuCategories { get; set; } = null!;
        public DbSet<GuestUser> GuestUsers { get; set; } = null!;
        public DbSet<Cart> Carts { get; set; } = null!;
        public DbSet<CartItem> CartItems { get; set; } = null!;
        public DbSet<Order> Orders { get; set; } = null!;
        public DbSet<OrderItem> OrderItems { get; set; } = null!;
        public DbSet<OtpRecord> OtpRecords { get; set; } = null!;
        public DbSet<ApiEndpoint> ApiEndpoints { get; set; } = null!;
        public DbSet<RolePermission> RolePermissions { get; set; } = null!;
        public DbSet<UserPermission> UserPermissions { get; set; } = null!;

        public DbSet<Topping> Toppings { get; set; } = null!;
        public DbSet<ProductTopping> ProductToppings { get; set; } = null!;
        public DbSet<ProductSize> ProductSizes { get; set; } = null!;
        public DbSet<ProductReview> ProductReviews { get; set; } = null!;
        public DbSet<GlobalMenuCategory> GlobalMenuCategories { get; set; } = null!;
        public DbSet<ProductReport> ProductReports { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;
        public DbSet<FavoriteRestaurant> FavoriteRestaurants { get; set; } = null!;
        public DbSet<UserAddress> UserAddresses { get; set; } = null!;
        public DbSet<TrustedDevice> TrustedDevices { get; set; } = null!;
        public DbSet<ShipperApplication> ShipperApplications { get; set; } = null!;
        public DbSet<ShipperProfile> ShipperProfiles { get; set; } = null!;
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User Entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("USER_ACCOUNT");
                entity.HasKey(e => e.Id);
                
                var userNameIndex = entity.HasIndex(e => e.UserName).IsUnique();
                var phoneIndex = entity.HasIndex(e => e.Phone).IsUnique();
                var emailIndex = entity.HasIndex(e => e.Email).IsUnique();

                if (Database.ProviderName != "Microsoft.EntityFrameworkCore.Sqlite")
                {
                    userNameIndex.HasFilter("[username] IS NOT NULL");
                    phoneIndex.HasFilter("[phone] IS NOT NULL");
                    emailIndex.HasFilter("[email] IS NOT NULL");
                }

                entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(255);
                entity.Property(e => e.UserName).HasMaxLength(50);
                entity.Property(e => e.Phone).HasMaxLength(15);
                entity.Property(e => e.Email).HasMaxLength(100);
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();
            });

            // UserProfile Entity
            modelBuilder.Entity<UserProfile>(entity =>
            {
                entity.ToTable("USER_PROFILE");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.UserAccountId).IsUnique();
                entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.AvatarUrl).HasMaxLength(255);
                entity.Property(e => e.Role).HasConversion<string>().IsRequired();

                // 1-to-1: User Account & User Profile
                entity.HasOne(d => d.UserAccount)
                    .WithOne(p => p.Profile)
                    .HasForeignKey<UserProfile>(d => d.UserAccountId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // SellerApplication Entity
            modelBuilder.Entity<SellerApplication>(entity =>
            {
                entity.ToTable("SELLER_APPLICATION");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.BusinessName).IsRequired().HasMaxLength(150);
                entity.Property(e => e.BusinessAddress).IsRequired();
                entity.Property(e => e.BusinessLicenseUrl).IsRequired().HasMaxLength(255);
                entity.Property(e => e.ShopImageUrl).IsRequired().HasMaxLength(255);
                entity.Property(e => e.ContactInfo).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Type).HasConversion<string>().IsRequired().HasDefaultValue(ApplicationType.NewSeller);
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();

                entity.HasOne(d => d.UserProfile)
                    .WithMany()
                    .HasForeignKey(d => d.UserProfileId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.Reviewer)
                    .WithMany()
                    .HasForeignKey(d => d.ReviewedBy)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // RestaurantProfile Entity
            modelBuilder.Entity<RestaurantProfile>(entity =>
            {
                entity.ToTable("RESTAURANT_PROFILE");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.SellerApplicationId).IsUnique();
                entity.HasIndex(e => e.OwnerId).IsUnique();
                entity.Property(e => e.RestaurantName).IsRequired().HasMaxLength(150);
                entity.Property(e => e.Address).IsRequired();
                entity.Property(e => e.Phone).IsRequired().HasMaxLength(15);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.Property(e => e.LogoUrl).HasMaxLength(255);
                entity.Property(e => e.BannerUrl).HasMaxLength(255);
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();
                entity.Property(e => e.Latitude);
                entity.Property(e => e.Longitude);
                entity.Property(e => e.OpeningTime);
                entity.Property(e => e.ClosingTime);
                entity.Property(e => e.MaxDeliveryRadiusKm);
                entity.Property(e => e.ShippingFee).HasColumnType("decimal(12,2)").IsRequired().HasDefaultValue(0);
                entity.Property(e => e.AverageRating).HasDefaultValue(0.0).IsRequired();
                entity.Property(e => e.ReviewCount).HasDefaultValue(0).IsRequired();
                entity.HasOne(d => d.SellerApplication)
                    .WithOne(p => p.RestaurantProfile)
                    .HasForeignKey<RestaurantProfile>(d => d.SellerApplicationId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.Owner)
                    .WithOne()
                    .HasForeignKey<RestaurantProfile>(d => d.OwnerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // MenuCategory Entity
            modelBuilder.Entity<MenuCategory>(entity =>
            {
                entity.ToTable("MENU_CATEGORY");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(255);
                entity.Property(e => e.SortOrder).IsRequired();

                entity.HasOne(d => d.Restaurant)
                    .WithMany()
                    .HasForeignKey(d => d.RestaurantId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Product Entity
            modelBuilder.Entity<Product>(entity =>
            {
                entity.ToTable("PRODUCT");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ItemName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Price).HasColumnType("decimal(12,2)").IsRequired();
                entity.Property(e => e.StockStatus).HasConversion<string>().IsRequired();
                entity.Property(e => e.IsHidden).IsRequired();
                entity.Property(e => e.IsFreeship).IsRequired();
                entity.Property(e => e.AvailableFrom);
                entity.Property(e => e.AvailableTo);
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();

                entity.HasOne(d => d.Restaurant)
                    .WithMany()
                    .HasForeignKey(d => d.RestaurantId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.Category)
                    .WithMany(c => c.Products)
                    .HasForeignKey(d => d.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(d => d.GlobalCategory)
                    .WithMany(c => c.Products)
                    .HasForeignKey(d => d.GlobalCategoryId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // ProductImage Entity
            modelBuilder.Entity<ProductImage>(entity =>
            {
                entity.ToTable("PRODUCT_IMAGE");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ImageUrl).IsRequired().HasMaxLength(255);

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.Images)
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // GuestUser Entity
            modelBuilder.Entity<GuestUser>(entity =>
            {
                entity.ToTable("GUEST_USER");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Phone).IsRequired().HasMaxLength(15);
                entity.Property(e => e.Email).HasMaxLength(100);
                entity.Property(e => e.DeliveryAddress).IsRequired();
                entity.Property(e => e.IpAddress).IsRequired().HasMaxLength(45);
            });

            // Cart Entity
            modelBuilder.Entity<Cart>(entity =>
            {
                entity.ToTable("CART");
                entity.HasKey(e => e.Id);
                
                var userAccountIndex = entity.HasIndex(e => e.UserAccountId).IsUnique();
                var guestUserIndex = entity.HasIndex(e => e.GuestUserId).IsUnique();

                if (Database.ProviderName != "Microsoft.EntityFrameworkCore.Sqlite")
                {
                    userAccountIndex.HasFilter("[user_account_id] IS NOT NULL");
                    guestUserIndex.HasFilter("[guest_user_id] IS NOT NULL");
                }

                entity.HasOne(d => d.UserAccount)
                    .WithOne()
                    .HasForeignKey<Cart>(d => d.UserAccountId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.GuestUser)
                    .WithOne()
                    .HasForeignKey<Cart>(d => d.GuestUserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // CartItem Entity
            modelBuilder.Entity<CartItem>(entity =>
            {
                entity.ToTable("CART_ITEM");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PriceAtAdded).HasColumnType("decimal(12,2)").IsRequired();

                entity.HasOne(d => d.Cart)
                    .WithMany(p => p.Items)
                    .HasForeignKey(d => d.CartId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.Product)
                    .WithMany()
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Order Entity
            modelBuilder.Entity<Order>(entity =>
            {
                entity.ToTable("ORDER");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TotalAmount).HasColumnType("decimal(12,2)").IsRequired();
                entity.Property(e => e.DeliveryAddress).IsRequired();
                entity.Property(e => e.ContactName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.ContactPhone).IsRequired().HasMaxLength(15);
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();
                entity.Property(e => e.PaymentMethod).HasConversion<string>().IsRequired();
                entity.Property(e => e.IpAddress).IsRequired().HasMaxLength(45);
                entity.Property(e => e.Note).HasMaxLength(500);
                entity.Property(e => e.RejectReason).HasMaxLength(500);

                entity.HasOne(d => d.UserAccount)
                    .WithMany()
                    .HasForeignKey(d => d.UserAccountId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.GuestUser)
                    .WithMany()
                    .HasForeignKey(d => d.GuestUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.Shipper)
                      .WithMany()
                      .HasForeignKey(d => d.ShipperId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // OrderItem Entity
            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.ToTable("ORDER_ITEM");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ItemName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.UnitPrice).HasColumnType("decimal(12,2)").IsRequired();
                entity.Property(e => e.TotalPrice).HasColumnType("decimal(12,2)").IsRequired();

                entity.HasOne(d => d.Order)
                    .WithMany(p => p.Items)
                    .HasForeignKey(d => d.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.Product)
                    .WithMany()
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // OtpRecord Entity
            modelBuilder.Entity<OtpRecord>(entity =>
            {
                entity.ToTable("OTP_RECORD");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EmailOrPhone).IsRequired().HasMaxLength(100);
                entity.Property(e => e.OtpCode).IsRequired().HasMaxLength(6);
                entity.Property(e => e.IpAddress).IsRequired().HasMaxLength(45);
                entity.Property(e => e.IsUsed).IsRequired().HasDefaultValue(false);
            });
            // Topping Entity
            modelBuilder.Entity<Topping>(entity =>
            {
                entity.ToTable("TOPPING");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ToppingName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Price).HasColumnType("decimal(12,2)").IsRequired();
                entity.Property(e => e.ImageUrl).HasMaxLength(255);
                entity.Property(e => e.IsAvailable).IsRequired();

                entity.HasOne(d => d.Restaurant)
                    .WithMany()
                    .HasForeignKey(d => d.RestaurantId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ProductTopping Entity (Junction Table)
            modelBuilder.Entity<ProductTopping>(entity =>
            {
                entity.ToTable("PRODUCT_TOPPING");
                entity.HasKey(e => new { e.ProductId, e.ToppingId });

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.ProductToppings)
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.Topping)
                    .WithMany(t => t.ProductToppings)
                    .HasForeignKey(d => d.ToppingId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ProductSize Entity
            modelBuilder.Entity<ProductSize>(entity =>
            {
                entity.ToTable("PRODUCT_SIZE");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.SizeName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ExtraPrice).HasColumnType("decimal(12,2)").IsRequired();
                entity.Property(e => e.IsDefault).IsRequired();

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.ProductSizes)
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ProductReview>(entity =>
            {
                entity.ToTable("PRODUCT_REVIEW");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Rating).IsRequired();
                entity.Property(e => e.Comment).HasMaxLength(1000);
                entity.Property(e => e.CreatedAt).IsRequired();

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.Reviews)
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.UserProfile)
                    .WithMany()
                    .HasForeignKey(d => d.UserProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
            modelBuilder.Entity<GlobalMenuCategory>(entity =>
            {
                entity.ToTable("GLOBAL_MENU_CATEGORY");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(255);
                entity.Property(e => e.SortOrder).IsRequired();
                entity.Property(e => e.IsHidden).IsRequired();
                entity.Property(e => e.CreatedAt);
                entity.Property(e => e.UpdatedAt);
            });

            modelBuilder.Entity<ProductReport>(entity =>
            {
                entity.ToTable("PRODUCT_REPORT");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Reason).IsRequired().HasMaxLength(150);
                entity.Property(e => e.Description).HasMaxLength(100);
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();

                entity.HasOne(d => d.Product)
                .WithMany()
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.Reporter)
                .WithMany()
                .HasForeignKey(d => d.ReporterId)
                .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Notification>(entity =>
            {
                entity.ToTable("NOTIFICATION");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(150);
                entity.Property(e => e.Message).IsRequired().HasMaxLength(500);
                entity.Property(e => e.NotificationType).IsRequired(false);
                entity.Property(e => e.IsRead).IsRequired();
                entity.Property(e => e.CreateAt);

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<FavoriteRestaurant>(entity =>
            {
                entity.ToTable("FAVORITE_RESTAURANT");
                entity.HasKey(e => new { e.UserProfileId, e.RestaurantId });

                entity.HasOne(d => d.UserProfile)
                .WithMany()
                .HasForeignKey(d => d.UserProfileId)
                .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.RestaurantProfile)
                .WithMany()
                .HasForeignKey(d => d.RestaurantId)
                .OnDelete(DeleteBehavior.Cascade);
            });

            // ApiEndpoint Entity
            modelBuilder.Entity<ApiEndpoint>(entity =>
            {
                entity.ToTable("API_ENDPOINT");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Path).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Method).IsRequired().HasMaxLength(10);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(150);
                entity.Property(e => e.Module).HasMaxLength(100);
                entity.Property(e => e.IsPublished).IsRequired().HasDefaultValue(true);
            });

            // RolePermission Entity
            modelBuilder.Entity<RolePermission>(entity =>
            {
                entity.ToTable("ROLE_PERMISSION");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Role).HasConversion<string>().IsRequired();
                entity.HasIndex(e => new { e.Role, e.ApiEndpointId }).IsUnique();

                entity.HasOne(d => d.ApiEndpoint)
                    .WithMany()
                    .HasForeignKey(d => d.ApiEndpointId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // UserPermission Entity
            modelBuilder.Entity<UserPermission>(entity =>
            {
                entity.ToTable("USER_PERMISSION");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.UserAccountId, e.ApiEndpointId }).IsUnique();
                entity.Property(e => e.IsGranted).IsRequired();

                entity.HasOne(d => d.UserAccount)
                    .WithMany()
                    .HasForeignKey(d => d.UserAccountId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.ApiEndpoint)
                    .WithMany()
                    .HasForeignKey(d => d.ApiEndpointId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // TrustedDevice Entity
            modelBuilder.Entity<TrustedDevice>(entity =>
            {
                entity.ToTable("TRUSTED_DEVICE");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.UserAccountId, e.IpAddress }).IsUnique();
                entity.Property(e => e.IpAddress).IsRequired().HasMaxLength(45);
                entity.Property(e => e.TrustedAt).IsRequired();
                entity.Property(e => e.ExpiresAt).IsRequired();

                entity.HasOne(d => d.UserAccount)
                    .WithMany()
                    .HasForeignKey(d => d.UserAccountId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // UserAddress Entity
            modelBuilder.Entity<UserAddress>(entity =>
            {
                entity.ToTable("USER_ADDRESS");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ContactName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.ContactPhone).IsRequired().HasMaxLength(15);
                entity.Property(e => e.AddressLine).IsRequired().HasMaxLength(500);
                entity.Property(e => e.IsDefault).IsRequired().HasDefaultValue(false);

                entity.HasOne(d => d.UserAccount)
                    .WithMany()
                    .HasForeignKey(d => d.UserAccountId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ShipperApplication>(entity =>
            {
                entity.ToTable("SHIPPER_APPLICATION");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.IdentityCardNumber).IsRequired().HasMaxLength(20);
                entity.Property(e => e.IdentityCardFrontUrl).IsRequired().HasMaxLength(255);
                entity.Property(e => e.IdentityCardBackUrl).IsRequired().HasMaxLength(255);
                entity.Property(e => e.VehicleType).HasConversion<string>().IsRequired();
                entity.Property(e => e.VehiclePlateNumber).IsRequired().HasMaxLength(20);
                entity.Property(e => e.DriverLicenseUrl).IsRequired().HasMaxLength(255);
                entity.Property(e => e.VehicleRegistrationUrl).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();
                
                entity.HasOne(d => d.UserProfile)
                      .WithMany()
                      .HasForeignKey(d => d.UserProfileId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.Reviewer)
                    .WithMany()
                    .HasForeignKey(d => d.ReviewedBy)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ShipperProfile>(entity =>
            {
                entity.ToTable("SHIPPER_PROFILE");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.VehiclePlateNumber).IsRequired().HasMaxLength(20);
                entity.Property(e => e.VehicleType).HasConversion<string>().IsRequired();
                entity.Property(e => e.IsOnline).IsRequired().HasDefaultValue(false);
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();
                entity.Property(e => e.WalletBalance).HasColumnType("decimal(12,2)").IsRequired().HasDefaultValue(0);
                entity.Property(e => e.ReputationScore).IsRequired().HasDefaultValue(100);
                entity.Property(e => e.Rating).IsRequired().HasDefaultValue(5.0);

                entity.HasOne(d => d.UserProfile)
                .WithOne()
                .HasForeignKey<ShipperProfile>(d => d.UserProfileId)
                .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.ShipperApplication)
                .WithOne()
                .HasForeignKey<ShipperProfile>(d => d.ShipperApplicationId)
                .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
