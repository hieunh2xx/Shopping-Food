using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Moq;
using ShoppingFood.Application.Features.Users.Queries;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.User;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Users
{
    public class GetUserProfileHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ShoppingFoodContext _dbContext;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly GetUserProfileHandler _handler;

        public GetUserProfileHandlerTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseSqlite(_connection)
                .Options;
            _dbContext = new ShoppingFoodContext(options);
            
            var createTablesSql = @"
                CREATE TABLE IF NOT EXISTS RESTAURANT_PROFILE (
                    Id TEXT PRIMARY KEY,
                    SellerApplicationId TEXT,
                    OwnerId TEXT,
                    RestaurantName TEXT,
                    Address TEXT,
                    Phone TEXT,
                    Email TEXT,
                    LogoUrl TEXT,
                    BannerUrl TEXT,
                    Status INTEGER DEFAULT 0,
                    Latitude REAL,
                    Longitude REAL,
                    OpeningTime TEXT,
                    ClosingTime TEXT,
                    MaxDeliveryRadiusKm REAL,
                    ShippingFee REAL DEFAULT 0,
                    DeliveryType INTEGER DEFAULT 0,
                    FreeDeliveryRadiusKm REAL DEFAULT 0,
                    FreeShippingMinimumOrder REAL DEFAULT 0,
                    CustomCommissionRate REAL,
                    AverageRating REAL DEFAULT 0,
                    ReviewCount INTEGER DEFAULT 0,
                    IsVerified INTEGER DEFAULT 0,
                    CreatedAt TEXT,
                    UpdatedAt TEXT
                );
                CREATE TABLE IF NOT EXISTS LOYALTY_POINT (
                    UserAccountId TEXT PRIMARY KEY,
                    PointsBalance INTEGER DEFAULT 0,
                    TotalEarnedPoints INTEGER DEFAULT 0,
                    Tier INTEGER DEFAULT 0,
                    UpdatedAt TEXT
                );";
            
            using (var cmd = _connection.CreateCommand())
            {
                cmd.CommandText = createTablesSql;
                cmd.ExecuteNonQuery();
            }

            _userRepoMock = new Mock<IUserRepository>();
            _handler = new GetUserProfileHandler(_userRepoMock.Object, _dbContext);
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task Handle_UserNotFound_Returns404()
        {
            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User>());

            var query = new GetUserProfileQuery { Username = "unknown" };
            var result = await _handler.Handle(query, CancellationToken.None);

            result.Code.Should().Be(404);
            result.Message.Should().Be("User not found.");
        }

        [Fact]
        public async Task Handle_CustomerUser_ReturnsProfileWithoutSellerInfo()
        {
            var userId = Guid.NewGuid();
            var user = new User
            {
                Id = userId,
                UserName = "customer",
                Status = UserStatus.Active,
                Profile = new UserProfile { Id = Guid.NewGuid(), Role = UserRole.Customer, FullName = "Customer Name" }
            };

            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { user });

            _dbContext.LoyaltyPoints.Add(new LoyaltyPoint { UserAccountId = userId, Tier = MemberTier.Silver, TotalEarnedPoints = 100, PointsBalance = 50 });
            await _dbContext.SaveChangesAsync();

            var query = new GetUserProfileQuery { Username = "customer" };
            var result = await _handler.Handle(query, CancellationToken.None);

            result.Code.Should().Be(200);
            result.Message.Should().Be("User profile retrieved successfully.");

            var data = result.Data as UserDto;
            data.Should().NotBeNull();
            data!.UserName.Should().Be("customer");
            data.Role.Should().Be("Customer");
            data.SellerInfo.Should().BeNull();
            data.Tier.Should().Be("Silver");
            data.TotalEarnedPoints.Should().Be(100);
        }

        [Fact]
        public async Task Handle_SellerUser_ReturnsProfileWithSellerInfo()
        {
            var userId = Guid.NewGuid();
            var profileId = Guid.NewGuid();
            var restaurantId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                UserName = "seller",
                Status = UserStatus.Active,
                Profile = new UserProfile { Id = profileId, Role = UserRole.Seller, FullName = "Seller Name" }
            };

            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { user });

            _dbContext.RestaurantProfiles.Add(new RestaurantProfile 
            { 
                Id = restaurantId, 
                OwnerId = profileId, 
                RestaurantName = "Test Restaurant",
                Status = RestaurantStatus.Active,
                DeliveryType = DeliveryType.SelfDelivery
            });
            await _dbContext.SaveChangesAsync();

            var query = new GetUserProfileQuery { Username = "seller" };
            var result = await _handler.Handle(query, CancellationToken.None);

            result.Code.Should().Be(200);
            
            var data = result.Data as UserDto;
            data.Should().NotBeNull();
            data!.Role.Should().Be("Seller");
            data.SellerInfo.Should().NotBeNull();
            data.SellerInfo!.RestaurantId.Should().Be(restaurantId);
            data.SellerInfo.RestaurantName.Should().Be("Test Restaurant");
        }
    }
}
