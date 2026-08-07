using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Features.UserAddresses.Commands;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using Xunit;

namespace ShoppingFood.Tests.Features.UserAddresses
{
    public class AddUserAddressHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ShoppingFoodContext _dbContext;
        private readonly AddUserAddressHandler _handler;

        public AddUserAddressHandlerTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();
            var options = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseSqlite(_connection)
                .Options;
            _dbContext = new ShoppingFoodContext(options);
            // Bypass EnsureCreated to avoid nvarchar(max) errors, manually create required table
            _dbContext.Database.ExecuteSqlRaw("CREATE TABLE USER_ADDRESS (Id TEXT, UserAccountId TEXT, ContactName TEXT, ContactPhone TEXT, AddressLine TEXT, IsDefault INTEGER DEFAULT 0, Latitude REAL, Longitude REAL, CreatedAt TEXT, UpdatedAt TEXT, IsDeleted INTEGER DEFAULT 0)");

            _handler = new AddUserAddressHandler(_dbContext);
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task Handle_FirstAddress_ForcesIsDefaultTrue()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var command = new AddUserAddressCommand
            {
                CurrentUserId = userId,
                ContactName = "John Doe",
                ContactPhone = "1234567890",
                AddressLine = "123 Main St",
                IsDefault = false // User didn't check default
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(200);
            result.Message.Should().Be("Thêm địa chỉ thành công.");

            var added = await _dbContext.UserAddresses.FirstOrDefaultAsync();
            added.Should().NotBeNull();
            added!.IsDefault.Should().BeTrue(); // Should be forced to true
            added.UserAccountId.Should().Be(userId);
        }

        [Fact]
        public async Task Handle_IsDefaultTrue_UnsetsOtherDefaults()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var existingAddress = new UserAddress
            {
                Id = Guid.NewGuid(),
                UserAccountId = userId,
                ContactName = "Jane Doe",
                ContactPhone = "0987654321",
                AddressLine = "456 Old St",
                IsDefault = true
            };
            _dbContext.UserAddresses.Add(existingAddress);
            await _dbContext.SaveChangesAsync();

            var command = new AddUserAddressCommand
            {
                CurrentUserId = userId,
                ContactName = "John Doe",
                ContactPhone = "1234567890",
                AddressLine = "123 New St",
                IsDefault = true // User checks default
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(200);

            var oldAddress = await _dbContext.UserAddresses.FindAsync(existingAddress.Id);
            oldAddress!.IsDefault.Should().BeFalse(); // Old one is unset

            var newAddressCount = await _dbContext.UserAddresses.CountAsync(a => a.UserAccountId == userId && a.IsDefault);
            newAddressCount.Should().Be(1); // Only one default should exist
        }

        [Fact]
        public async Task Handle_IsDefaultFalseWithExistingAddresses_KeepsIsDefaultFalse()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var existingAddress = new UserAddress
            {
                Id = Guid.NewGuid(),
                UserAccountId = userId,
                ContactName = "Jane Doe",
                ContactPhone = "0987654321",
                AddressLine = "456 Old St",
                IsDefault = true
            };
            _dbContext.UserAddresses.Add(existingAddress);
            await _dbContext.SaveChangesAsync();

            var command = new AddUserAddressCommand
            {
                CurrentUserId = userId,
                ContactName = "John Doe",
                ContactPhone = "1234567890",
                AddressLine = "123 New St",
                IsDefault = false
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(200);

            var newAddress = await _dbContext.UserAddresses.FirstOrDefaultAsync(a => a.AddressLine == "123 New St");
            newAddress.Should().NotBeNull();
            newAddress!.IsDefault.Should().BeFalse();
        }
    }
}
