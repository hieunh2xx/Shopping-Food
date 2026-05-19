using Microsoft.EntityFrameworkCore;
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
        public DbSet<GuestUser> GuestUsers { get; set; } = null!;
        public DbSet<Cart> Carts { get; set; } = null!;
        public DbSet<CartItem> CartItems { get; set; } = null!;
        public DbSet<Order> Orders { get; set; } = null!;
        public DbSet<OrderItem> OrderItems { get; set; } = null!;
        public DbSet<OtpRecord> OtpRecords { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User Entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("USER_ACCOUNT");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.UserName).IsUnique().HasFilter("[username] IS NOT NULL");
                entity.HasIndex(e => e.Phone).IsUnique().HasFilter("[phone] IS NOT NULL");
                entity.HasIndex(e => e.Email).IsUnique().HasFilter("[email] IS NOT NULL");
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
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();

                entity.HasOne(d => d.SellerApplication)
                    .WithOne(p => p.RestaurantProfile)
                    .HasForeignKey<RestaurantProfile>(d => d.SellerApplicationId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.Owner)
                    .WithOne()
                    .HasForeignKey<RestaurantProfile>(d => d.OwnerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Product Entity
            modelBuilder.Entity<Product>(entity =>
            {
                entity.ToTable("PRODUCT");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ItemName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Price).HasColumnType("decimal(12,2)").IsRequired();
                entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
                entity.Property(e => e.StockStatus).HasConversion<string>().IsRequired();

                entity.HasOne(d => d.Restaurant)
                    .WithMany()
                    .HasForeignKey(d => d.RestaurantId)
                    .OnDelete(DeleteBehavior.Cascade);
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
                entity.HasIndex(e => e.UserAccountId).IsUnique().HasFilter("[user_account_id] IS NOT NULL");
                entity.HasIndex(e => e.GuestUserId).IsUnique().HasFilter("[guest_user_id] IS NOT NULL");

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

                entity.HasOne(d => d.UserAccount)
                    .WithMany()
                    .HasForeignKey(d => d.UserAccountId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.GuestUser)
                    .WithMany()
                    .HasForeignKey(d => d.GuestUserId)
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
            });
        }
    }
}
