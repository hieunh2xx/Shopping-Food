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

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            base.OnConfiguring(optionsBuilder);
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
        public DbSet<OrderExplanationRequest> OrderExplanationRequests { get; set; } = null!;
        public DbSet<OtpRecord> OtpRecords { get; set; } = null!;
        public DbSet<ApiEndpoint> ApiEndpoints { get; set; } = null!;
        public DbSet<RolePermission> RolePermissions { get; set; } = null!;
        public DbSet<UserPermission> UserPermissions { get; set; } = null!;

        public DbSet<Topping> Toppings { get; set; } = null!;
        public DbSet<ProductTopping> ProductToppings { get; set; } = null!;
        public DbSet<ProductSize> ProductSizes { get; set; } = null!;
        public DbSet<ProductReview> ProductReviews { get; set; } = null!;
        public DbSet<GlobalMenuCategory> GlobalMenuCategories { get; set; } = null!;
        public DbSet<SystemReport> SystemReports { get; set; } = null!;
        public DbSet<SystemConfig> SystemConfigs { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;
        public DbSet<FavoriteRestaurant> FavoriteRestaurants { get; set; } = null!;
        public DbSet<UserAddress> UserAddresses { get; set; } = null!;
        public DbSet<TrustedDevice> TrustedDevices { get; set; } = null!;
        public DbSet<ShipperApplication> ShipperApplications { get; set; } = null!;
        public DbSet<ShipperProfile> ShipperProfiles { get; set; } = null!;
        public DbSet<OrderDeliveryProposal> OrderDeliveryProposals { get; set; } = null!;
        public DbSet<Discount> Discounts { get; set; } = null!;
        public DbSet<CustomerDiscount> CustomerDiscounts { get; set; } = null!;
        public DbSet<LoyaltyPoint> LoyaltyPoints { get; set; } = null!;
        public DbSet<LoyaltyPointHistory> LoyaltyPointHistories { get; set; } = null!;
        public DbSet<PointGiftConfig> PointGiftConfigs { get; set; } = null!;
        public DbSet<BuyXGetYPromotion> BuyOneGetOnePrograms { get; set; } = null!;
        public DbSet<FlashSale> FlashSales { get; set; } = null!;
        public DbSet<FlashSaleProduct> FlashSaleProducts { get; set; } = null!;
        public DbSet<MemberTierConfig> MemberTierConfigs { get; set; } = null!;
        public DbSet<OrderDispatchHistory> OrderDispatchHistories { get; set; } = null!;
        public DbSet<ShipperReview> ShipperReviews { get; set; } = null!;
        public DbSet<ChatSession> ChatSessions { get; set; } = null!;
        public DbSet<ChatMessage> ChatMessages { get; set; } = null!;
        public DbSet<Faq> Faqs { get; set; } = null!;
        public DbSet<Wallet> Wallets { get; set; } = null!;
        public DbSet<FinancialTransaction> FinancialTransactions { get; set; } = null!;
        public DbSet<WithdrawalRequest> WithdrawalRequests { get; set; } = null!;
        public DbSet<CodRemittanceRequest> CodRemittanceRequests { get; set; } = null!;
        public DbSet<EInvoiceRequest> EInvoiceRequests { get; set; } = null!;
        public DbSet<PlatformFinanceConfig> PlatformFinanceConfigs { get; set; } = null!;
        public DbSet<PaymentSession> PaymentSessions { get; set; } = null!;
        public DbSet<SepayWebhookLog> SepayWebhookLogs { get; set; } = null!;
        public DbSet<ShipperReputationHistory> ShipperReputationHistories { get; set; } = null!;
        public DbSet<BlacklistKeyword> BlacklistKeywords { get; set; } = null!;
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ShipperReputationHistory>(entity =>
            {
                entity.ToTable("SHIPPER_REPUTATION_HISTORY");
            });

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
                entity.Property(e => e.FoodSafetyCertificateUrl).IsRequired().HasMaxLength(255).HasDefaultValue(string.Empty);
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
                entity.Property(e => e.FreeShippingMinimumOrder).HasColumnType("decimal(18,2)").IsRequired().HasDefaultValue(0);
                entity.Property(e => e.CustomCommissionRate).HasColumnType("decimal(18,2)");
                entity.Property(e => e.CodPayableAmount).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(e => e.LastMaintenanceFeeChargedAt);
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
                entity.Property(e => e.IsDeleted).IsRequired().HasDefaultValue(false);

                entity.HasQueryFilter(p => !p.IsDeleted);

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

                entity.HasQueryFilter(e => !e.Product.IsDeleted);

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

            modelBuilder.Entity<BlacklistKeyword>(entity =>
            {
                entity.ToTable("BLACKLIST_KEYWORD");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Keyword).IsUnique();
                entity.Property(e => e.Keyword).IsRequired().HasMaxLength(255);
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
                entity.Property(e => e.ToppingAndSizeSurcharge).HasColumnType("decimal(12,2)").IsRequired();

                entity.HasQueryFilter(e => !e.Product.IsDeleted);

                entity.HasOne(d => d.Cart)
                    .WithMany(p => p.Items)
                    .HasForeignKey(d => d.CartId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.Product)
                    .WithMany()
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.BuyXGetYPromotion)
                    .WithMany()
                    .HasForeignKey(d => d.BuyXGetYPromotionId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(d => d.ParentCartItem)
                    .WithMany()
                    .HasForeignKey(d => d.ParentCartItemId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // Order Entity
            modelBuilder.Entity<Order>(entity =>
            {
                entity.ToTable("ORDER");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TotalAmount).HasColumnType("decimal(12,2)").IsRequired();
                entity.Property(e => e.ShippingFee).HasColumnType("decimal(12,2)").IsRequired().HasDefaultValue(0);
                entity.Property(e => e.ShipperIncome).HasColumnType("decimal(12,2)").IsRequired().HasDefaultValue(0);
                entity.Property(e => e.ShipperBaseFeeAmount).HasColumnType("decimal(12,2)").IsRequired().HasDefaultValue(0);
                entity.Property(e => e.ShipperDistanceFeeAmount).HasColumnType("decimal(12,2)").IsRequired().HasDefaultValue(0);
                entity.Property(e => e.ShipperPeakBonus).HasColumnType("decimal(12,2)").IsRequired().HasDefaultValue(0);
                entity.Property(e => e.DeliveryAddress).IsRequired();
                entity.Property(e => e.ContactName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.ContactPhone).IsRequired().HasMaxLength(15);
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();
                entity.Property(e => e.PaymentMethod).HasConversion<string>().IsRequired();
                entity.Property(e => e.PaymentStatus).HasConversion<string>().IsRequired().HasDefaultValue(PaymentStatus.Pending);
                entity.Property(e => e.ItemsSubtotal).HasColumnType("decimal(12,2)").HasDefaultValue(0);
                entity.Property(e => e.DiscountAmount).HasColumnType("decimal(12,2)").HasDefaultValue(0);
                entity.Property(e => e.TierDiscountAmount).HasColumnType("decimal(12,2)").HasDefaultValue(0);
                entity.Property(e => e.PlatformCommission).HasColumnType("decimal(12,2)").HasDefaultValue(0);
                entity.Property(e => e.SellerPayout).HasColumnType("decimal(12,2)").HasDefaultValue(0);
                entity.Property(e => e.IsFinancialSettled).HasDefaultValue(false);
                entity.Property(e => e.IpAddress).IsRequired().HasMaxLength(45);
                entity.Property(e => e.Note).HasMaxLength(500);
                entity.Property(e => e.RejectReason).HasMaxLength(500);
                entity.Property(e => e.DeliveryLatitude);
                entity.Property(e => e.DeliveryLongitude);

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

                entity.HasOne(d => d.AppliedDiscount)
                      .WithMany()
                      .HasForeignKey(d => d.AppliedDiscountId)
                      .OnDelete(DeleteBehavior.SetNull);
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

                entity.HasQueryFilter(e => !e.Product.IsDeleted);

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

                entity.HasQueryFilter(e => !e.Product.IsDeleted);

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
                entity.Property(e => e.SellerReply).HasMaxLength(1000);
                entity.Property(e => e.SellerRepliedAt);
                entity.Property(e => e.CreatedAt).IsRequired();

                entity.HasQueryFilter(e => !e.Product.IsDeleted);

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

            modelBuilder.Entity<SystemReport>(entity =>
            {
                entity.ToTable("SYSTEM_REPORT");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TargetType).HasConversion<string>().IsRequired();
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Content).HasMaxLength(2000);
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();

                entity.HasOne(d => d.Reporter)
                .WithMany()
                .HasForeignKey(d => d.ReporterId)
                .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<OrderExplanationRequest>(entity =>
            {
                entity.ToTable("ORDER_EXPLANATION_REQUEST");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.RequestMessage).IsRequired().HasMaxLength(1000);
                entity.Property(e => e.ShipperReply).HasMaxLength(2000);
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();
                entity.HasIndex(e => e.OrderId);

                entity.HasOne(d => d.Order)
                    .WithMany()
                    .HasForeignKey(d => d.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.RequestedBy)
                    .WithMany()
                    .HasForeignKey(d => d.RequestedByProfileId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Notification>(entity =>
            {
                entity.ToTable("NOTIFICATION");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(150);
                entity.Property(e => e.Message).IsRequired().HasMaxLength(500);
                entity.Property(e => e.NotificationType).HasConversion<string>().IsRequired(false);
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
                entity.Property(e => e.Latitude);
                entity.Property(e => e.Longitude);

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
                entity.Property(e => e.CodCollectedAmount).HasColumnType("decimal(12,2)").IsRequired().HasDefaultValue(0);
                entity.Property(e => e.DebtLimit).HasColumnType("decimal(12,2)").IsRequired().HasDefaultValue(5_000_000m);
                entity.Property(e => e.ReputationScore).IsRequired().HasDefaultValue(100);
                entity.Property(e => e.Rating).IsRequired().HasDefaultValue(5.0);
                entity.Property(e => e.OperatingLatitude);
                entity.Property(e => e.OperatingLongitude);
                entity.Property(e => e.OperatingRadiusKm);
                entity.Property(e => e.WorkingSchedule).HasMaxLength(2000);
                entity.Property(e => e.OperatingLatitude);
                entity.Property(e => e.OperatingLongitude);
                entity.Property(e => e.OperatingRadiusKm);
                entity.Property(e => e.WorkingSchedule).HasMaxLength(2000);
                entity.Property(e => e.SuspendedUntil);
                entity.Property(e => e.SuspendedReason).HasMaxLength(500);

                entity.HasOne(d => d.UserProfile)
                .WithOne()
                .HasForeignKey<ShipperProfile>(d => d.UserProfileId)
                .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.ShipperApplication)
                .WithOne()
                .HasForeignKey<ShipperProfile>(d => d.ShipperApplicationId)
                .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<OrderDeliveryProposal>(entity =>
            {
                entity.ToTable("ORDER_DELIVERY_PROPOSAL");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();

                entity.HasOne(d => d.Shipper)
                    .WithMany()
                    .HasForeignKey(d => d.ShipperId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.Order)
                    .WithMany()
                    .HasForeignKey(d => d.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Discount>(entity =>
            {
                entity.ToTable("DISCOUNT");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Type).HasConversion<string>().IsRequired();
                entity.Property(e => e.Value).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(e => e.MaxDiscountAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.MinOrderAmount).HasColumnType("decimal(18,2)").IsRequired().HasDefaultValue(0);
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();
                entity.Property(e => e.IsDeleted).IsRequired().HasDefaultValue(false);

                entity.HasOne(d => d.Restaurant)
                    .WithMany()
                    .HasForeignKey(d => d.RestaurantId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<CustomerDiscount>(entity =>
            {
                entity.ToTable("CUSTOMER_DISCOUNT");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UsageCount).IsRequired().HasDefaultValue(0);

                entity.HasOne(d => d.UserAccount)
                    .WithMany()
                    .HasForeignKey(d => d.UserAccountId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.Discount)
                    .WithMany()
                    .HasForeignKey(d => d.DiscountId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<LoyaltyPoint>(entity =>
            {
                entity.ToTable("LOYALTY_POINT");
                entity.HasKey(e => e.UserAccountId);
                entity.Property(e => e.PointsBalance).IsRequired().HasDefaultValue(0);
                entity.Property(e => e.TotalEarnedPoints).IsRequired().HasDefaultValue(0);
                entity.Property(e => e.Tier).HasConversion<string>().IsRequired();

                entity.HasOne(d => d.UserAccount)
                    .WithOne()
                    .HasForeignKey<LoyaltyPoint>(d => d.UserAccountId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<LoyaltyPointHistory>(entity =>
            {
                entity.ToTable("LOYALTY_POINT_HISTORY");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Points).IsRequired();
                entity.Property(e => e.TransactionType).HasConversion<string>().IsRequired();
                entity.Property(e => e.Description).IsRequired().HasMaxLength(500);

                entity.HasOne(d => d.UserAccount)
                    .WithMany()
                    .HasForeignKey(d => d.UserAccountId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<PointGiftConfig>(entity =>
            {
                entity.ToTable("POINT_GIFT_CONFIG");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PointRequired).IsRequired();
                entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
                entity.Property(e => e.IsDeleted).IsRequired().HasDefaultValue(false);

                entity.HasOne(d => d.Discount)
                    .WithMany()
                    .HasForeignKey(d => d.DiscountId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasQueryFilter(p => !p.IsDeleted && !p.Discount.IsDeleted);
            });

            modelBuilder.Entity<BuyXGetYPromotion>(entity =>
            {
                entity.ToTable("BUY_X_GET_Y_PROMOTION");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.BuyQuantity).IsRequired().HasDefaultValue(1);
                entity.Property(e => e.GiftQuantity).IsRequired().HasDefaultValue(1);
                entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

                entity.HasQueryFilter(e => !e.TriggerProduct.IsDeleted && !e.GiftProduct.IsDeleted);

                entity.HasOne(d => d.Restaurant)
                    .WithMany()
                    .HasForeignKey(d => d.RestaurantId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.TriggerProduct)
                    .WithMany()
                    .HasForeignKey(d => d.TriggerProductId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.GiftProduct)
                    .WithMany()
                    .HasForeignKey(d => d.GiftProductId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<FlashSale>(entity =>
            {
                entity.ToTable("FLASH_SALE");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();
                entity.Property(e => e.IsDeleted).IsRequired().HasDefaultValue(false);

                entity.HasQueryFilter(d => !d.IsDeleted);
            });

            modelBuilder.Entity<FlashSaleProduct>(entity =>
            {
                entity.ToTable("FLASH_SALE_PRODUCT");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FlashSalePrice).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(e => e.QuantityLimit).IsRequired();
                entity.Property(e => e.SoldQuantity).IsRequired().HasDefaultValue(0);
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();
                entity.Property(e => e.RejectReason).HasMaxLength(500);

                entity.HasOne(e => e.FlashSale)
                    .WithMany()
                    .HasForeignKey(d => d.FlashSaleId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Product)
                    .WithMany()
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasQueryFilter(fsp => !fsp.FlashSale.IsDeleted && !fsp.Product.IsDeleted);
            });

            modelBuilder.Entity<MemberTierConfig>(entity =>
            {
                entity.ToTable("MEMBER_TIER_CONFIG");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Tier).HasConversion<string>().IsRequired();

                entity.HasData(new MemberTierConfig { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Tier = MemberTier.Silver, MinPoints = 100, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                               new MemberTierConfig { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Tier = MemberTier.Gold, MinPoints = 500, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                               new MemberTierConfig { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), Tier = MemberTier.Diamond, MinPoints = 1000, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) });
            });

            modelBuilder.Entity<OrderDispatchHistory>(entity =>
            {
                entity.ToTable("ORDER_DISPATCH_HISTORY");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ActionType).HasConversion<string>().IsRequired();

                entity.HasOne(e => e.Order)
                .WithMany()
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ShipperReview>(entity =>
            {
                entity.ToTable("SHIPPER_REVIEW");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.OrderId).IsUnique(); // 1 đơn chỉ 1 review
                entity.Property(e => e.Rating).IsRequired();
                entity.Property(e => e.Comment).HasMaxLength(1000);

                entity.HasOne(d => d.Order)
                    .WithMany()
                    .HasForeignKey(d => d.OrderId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.ShipperProfile)
                    .WithMany()
                    .HasForeignKey(d => d.ShipperProfileId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.Reviewer)
                    .WithMany()
                    .HasForeignKey(d => d.ReviewerAccountId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ChatSession>(entity =>
            {
                entity.ToTable("CHAT_SESSION");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Topic).HasConversion<string>().IsRequired();
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();


                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.Support)
                    .WithMany()
                    .HasForeignKey(d => d.SupportId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ChatMessage>(entity =>
            {
                entity.ToTable("CHAT_MESSAGE");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Content).IsRequired().HasMaxLength(2000);
                entity.Property(e => e.SenderRole).HasConversion<string>().IsRequired();

                entity.HasOne(d => d.Session)
                .WithMany(s => s.Messages)
                .HasForeignKey(d => d.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.Sender)
                .WithMany()
                .HasForeignKey(d => d.SenderId)
                .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Faq>(entity =>
            {
                entity.ToTable("FAQ");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Question).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Answer).IsRequired();
                entity.Property(e => e.IsActive).IsRequired();
            });

            modelBuilder.Entity<Wallet>(entity =>
            {
                entity.ToTable("WALLET");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.OwnerType, e.OwnerId }).IsUnique();
                entity.Property(e => e.OwnerType).HasConversion<string>().IsRequired();
                entity.Property(e => e.Balance).HasColumnType("decimal(12,2)").HasDefaultValue(0);
                entity.Property(e => e.BankName).HasMaxLength(100);
                entity.Property(e => e.BankAccountNumber).HasMaxLength(30);
                entity.Property(e => e.BankAccountHolder).HasMaxLength(100);
            });

            modelBuilder.Entity<FinancialTransaction>(entity =>
            {
                entity.ToTable("FINANCIAL_TRANSACTION");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Type).HasConversion<string>().IsRequired();
                entity.Property(e => e.Amount).HasColumnType("decimal(12,2)").IsRequired();
                entity.Property(e => e.BalanceAfter).HasColumnType("decimal(12,2)").IsRequired();
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.ReferenceType).HasMaxLength(50);
                entity.HasOne(d => d.Wallet).WithMany().HasForeignKey(d => d.WalletId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<WithdrawalRequest>(entity =>
            {
                entity.ToTable("WITHDRAWAL_REQUEST");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Amount).HasColumnType("decimal(12,2)").IsRequired();
                entity.Property(e => e.BankName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.BankAccountNumber).IsRequired().HasMaxLength(30);
                entity.Property(e => e.BankAccountHolder).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();
                entity.Property(e => e.RejectReason).HasMaxLength(500);
                entity.HasOne(d => d.Wallet).WithMany().HasForeignKey(d => d.WalletId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<CodRemittanceRequest>(entity =>
            {
                entity.ToTable("COD_REMITTANCE_REQUEST");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Amount).HasColumnType("decimal(12,2)").IsRequired();
                entity.Property(e => e.Note).HasMaxLength(500);
                entity.Property(e => e.ProofImageUrl).HasMaxLength(500);
                entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(50).IsRequired();
                entity.Property(e => e.RejectReason).HasMaxLength(500);
                entity.HasIndex(e => e.ShipperProfileId);
                entity.HasIndex(e => e.Status);
                entity.HasOne(d => d.ShipperProfile)
                    .WithMany()
                    .HasForeignKey(d => d.ShipperProfileId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<EInvoiceRequest>(entity =>
            {
                entity.ToTable("E_INVOICE_REQUEST");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TaxCode).IsRequired().HasMaxLength(20);
                entity.Property(e => e.CompanyName).IsRequired().HasMaxLength(200);
                entity.Property(e => e.CompanyAddress).HasMaxLength(500);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();
                entity.HasOne(d => d.Order).WithMany().HasForeignKey(d => d.OrderId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<PlatformFinanceConfig>(entity =>
            {
                entity.ToTable("PLATFORM_FINANCE_CONFIG");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CommissionRate).HasColumnType("decimal(5,4)").HasDefaultValue(0.10m);
                entity.Property(e => e.DefaultShipperDebtLimit).HasColumnType("decimal(12,2)").HasDefaultValue(5_000_000m);
                entity.Property(e => e.BaseDeliveryFee).HasColumnType("decimal(12,2)").HasDefaultValue(15000m);
                entity.Property(e => e.FeePerKm).HasColumnType("decimal(12,2)").HasDefaultValue(5000m);
                entity.Property(e => e.RushHourMultiplier).HasColumnType("decimal(5,2)").HasDefaultValue(1.2m);
                entity.Property(e => e.ShipperBaseFee).HasColumnType("decimal(12,2)").HasDefaultValue(12000m);
                entity.Property(e => e.ShipperFeePerKm).HasColumnType("decimal(12,2)").HasDefaultValue(4000m);
                entity.Property(e => e.ShipperRushHourBonus).HasColumnType("decimal(12,2)").HasDefaultValue(5000m);
                entity.Property(e => e.MinWithdrawalAmount).HasColumnType("decimal(12,2)").HasDefaultValue(50_000m);
                entity.Property(e => e.LargeWithdrawalThreshold).HasColumnType("decimal(12,2)").HasDefaultValue(5_000_000m);
                entity.Property(e => e.SellerMaintenanceFee).HasColumnType("decimal(12,2)").HasDefaultValue(0m);
            });

            modelBuilder.Entity<PaymentSession>(entity =>
            {
                entity.ToTable("PAYMENT_SESSION");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PaymentMethod).HasConversion<string>().IsRequired();
                entity.Property(e => e.EWalletProvider).HasConversion<string>();
                entity.Property(e => e.Amount).HasColumnType("decimal(12,2)").IsRequired();
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();
                entity.Property(e => e.CardLastFour).HasMaxLength(4);
                entity.Property(e => e.CardBrand).HasMaxLength(20);
                entity.Property(e => e.InvoiceNumber).HasMaxLength(64);
                entity.HasIndex(e => e.InvoiceNumber).IsUnique().HasFilter("[InvoiceNumber] IS NOT NULL");
                entity.Property(e => e.SepayOrderId).HasMaxLength(100);
                entity.Property(e => e.ExternalTransactionId).HasMaxLength(100);
                entity.Property(e => e.SepayPaymentMethod).HasMaxLength(50);
            });

            modelBuilder.Entity<SepayWebhookLog>(entity =>
            {
                entity.ToTable("SEPAY_WEBHOOK_LOG");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EventKey).HasMaxLength(200).IsRequired();
                entity.HasIndex(e => e.EventKey).IsUnique();
                entity.Property(e => e.EventType).HasMaxLength(50);
                entity.Property(e => e.RawPayload).HasColumnType("nvarchar(max)");
                entity.Property(e => e.IsProcessed).HasDefaultValue(false);
            });

            modelBuilder.Entity<SystemConfig>(entity =>
            {
                entity.ToTable("SYSTEM_CONFIG");
                entity.HasKey(e => e.Key);
                entity.Property(e => e.Key).HasMaxLength(100);
            });
        }
    }
}
