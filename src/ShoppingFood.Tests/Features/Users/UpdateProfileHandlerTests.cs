using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using Xunit;

namespace ShoppingFood.Tests.Features.Users
{
    public class UpdateProfileHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ShoppingFoodContext _dbContext;
        private readonly UpdateProfileHandler _handler;

        public UpdateProfileHandlerTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseSqlite(_connection)
                .Options;
            _dbContext = new ShoppingFoodContext(options);
            
            var createTablesSql = @"
                CREATE TABLE IF NOT EXISTS USER_ACCOUNT (
                    Id TEXT PRIMARY KEY,
                    Phone TEXT UNIQUE,
                    UserName TEXT,
                    Email TEXT,
                    IsEmailActive INTEGER DEFAULT 0,
                    PasswordHash TEXT,
                    RefreshToken TEXT,
                    RefreshTokenExpiryTime TEXT,
                    DeleteRequestedAt TEXT,
                    Status INTEGER DEFAULT 0,
                    CreatedAt TEXT,
                    UpdatedAt TEXT
                );
                CREATE TABLE IF NOT EXISTS USER_PROFILE (
                    Id TEXT PRIMARY KEY,
                    UserAccountId TEXT,
                    FullName TEXT,
                    AvatarUrl TEXT,
                    Gender TEXT,
                    DateOfBirth TEXT,
                    Role INTEGER DEFAULT 0,
                    CreatedAt TEXT,
                    UpdatedAt TEXT,
                    FOREIGN KEY(UserAccountId) REFERENCES USER_ACCOUNT(Id)
                );";
            
            using (var cmd = _connection.CreateCommand())
            {
                cmd.CommandText = createTablesSql;
                cmd.ExecuteNonQuery();
            }

            _handler = new UpdateProfileHandler(_dbContext);
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task Handle_Unauthorized_Returns401()
        {
            var command = new UpdateProfileCommand { CurrentUserId = Guid.Empty };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(401);
            result.Message.Should().Be("Unauthorized");
        }

        [Fact]
        public async Task Handle_ProfileNotFound_Returns404()
        {
            var command = new UpdateProfileCommand { CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(404);
            result.Message.Should().Be("User profile not found");
        }

        [Fact]
        public async Task Handle_ValidUpdates_UpdatesFieldsAndReturns200()
        {
            var userId = Guid.NewGuid();
            var profileId = Guid.NewGuid();
            
            _dbContext.Users.Add(new User { Id = userId, Phone = "0123456789" });
            _dbContext.UserProfiles.Add(new UserProfile { Id = profileId, UserAccountId = userId, FullName = "Old Name" });
            await _dbContext.SaveChangesAsync();

            var command = new UpdateProfileCommand 
            { 
                CurrentUserId = userId,
                FullName = "New Name",
                AvatarUrl = "new-avatar.png",
                Gender = "Male",
                DateOfBirth = new DateTime(2000, 1, 1),
                Phone = "0987654321"
            };

            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Profile updated successfully");

            var updatedProfile = await _dbContext.UserProfiles.Include(p => p.UserAccount).FirstAsync(p => p.Id == profileId);
            updatedProfile.FullName.Should().Be("New Name");
            updatedProfile.AvatarUrl.Should().Be("new-avatar.png");
            updatedProfile.Gender.Should().Be("Male");
            updatedProfile.DateOfBirth.Should().Be(new DateTime(2000, 1, 1));
            updatedProfile.UserAccount.Phone.Should().Be("0987654321");
        }

        [Fact]
        public async Task Handle_DuplicatePhone_Returns400()
        {
            var userId1 = Guid.NewGuid();
            var profileId1 = Guid.NewGuid();
            
            var userId2 = Guid.NewGuid();
            
            _dbContext.Users.Add(new User { Id = userId1, Phone = "0123456789" });
            _dbContext.UserProfiles.Add(new UserProfile { Id = profileId1, UserAccountId = userId1, FullName = "User 1" });
            
            _dbContext.Users.Add(new User { Id = userId2, Phone = "0987654321" });
            await _dbContext.SaveChangesAsync();

            var command = new UpdateProfileCommand 
            { 
                CurrentUserId = userId1,
                Phone = "0987654321" // Duplicate phone
            };

            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("This phone number is already used by another account.");
        }
    }
}
