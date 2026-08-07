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
    public class UpdateUserAddressHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ShoppingFoodContext _dbContext;
        private readonly UpdateUserAddressHandler _handler;

        public UpdateUserAddressHandlerTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();
            var options = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseSqlite(_connection)
                .Options;
            _dbContext = new ShoppingFoodContext(options);
            _dbContext.Database.ExecuteSqlRaw("CREATE TABLE USER_ADDRESS (Id TEXT, UserAccountId TEXT, ContactName TEXT, ContactPhone TEXT, AddressLine TEXT, IsDefault INTEGER DEFAULT 0, Latitude REAL, Longitude REAL, CreatedAt TEXT, UpdatedAt TEXT, IsDeleted INTEGER DEFAULT 0)");

            _handler = new UpdateUserAddressHandler(_dbContext);
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task Handle_AddressNotFound_Returns404()
        {
            var command = new UpdateUserAddressCommand { CurrentUserId = Guid.NewGuid(), Id = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(404);
            result.Message.Should().Be("Không tìm thấy địa chỉ.");
        }

        [Fact]
        public async Task Handle_SetsToDefault_UnsetsOtherDefaults()
        {
            var userId = Guid.NewGuid();
            var defaultAddress = new UserAddress { Id = Guid.NewGuid(), UserAccountId = userId, AddressLine = "Default", IsDefault = true };
            var anotherAddress = new UserAddress { Id = Guid.NewGuid(), UserAccountId = userId, AddressLine = "Another", IsDefault = false };
            
            _dbContext.UserAddresses.AddRange(defaultAddress, anotherAddress);
            await _dbContext.SaveChangesAsync();

            var command = new UpdateUserAddressCommand 
            { 
                CurrentUserId = userId, 
                Id = anotherAddress.Id,
                ContactName = "New",
                ContactPhone = "123",
                AddressLine = "New",
                IsDefault = true // Changing to true
            };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            
            var oldDefault = await _dbContext.UserAddresses.FindAsync(defaultAddress.Id);
            oldDefault!.IsDefault.Should().BeFalse();
            
            var newDefault = await _dbContext.UserAddresses.FindAsync(anotherAddress.Id);
            newDefault!.IsDefault.Should().BeTrue();
        }

        [Fact]
        public async Task Handle_UnsetsDefaultWhenOnlyOne_KeepsItDefault()
        {
            var userId = Guid.NewGuid();
            var defaultAddress = new UserAddress { Id = Guid.NewGuid(), UserAccountId = userId, AddressLine = "Default", IsDefault = true };
            
            _dbContext.UserAddresses.Add(defaultAddress);
            await _dbContext.SaveChangesAsync();

            var command = new UpdateUserAddressCommand 
            { 
                CurrentUserId = userId, 
                Id = defaultAddress.Id,
                ContactName = "New",
                ContactPhone = "123",
                AddressLine = "New",
                IsDefault = false // Trying to unset
            };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            
            var address = await _dbContext.UserAddresses.FindAsync(defaultAddress.Id);
            address!.IsDefault.Should().BeTrue(); // Should be kept as true
        }

        [Fact]
        public async Task Handle_UnsetsDefaultWithMultiple_SetsAnotherAsDefault()
        {
            var userId = Guid.NewGuid();
            var defaultAddress = new UserAddress { Id = Guid.NewGuid(), UserAccountId = userId, AddressLine = "Default", IsDefault = true };
            var anotherAddress = new UserAddress { Id = Guid.NewGuid(), UserAccountId = userId, AddressLine = "Another", IsDefault = false };
            
            _dbContext.UserAddresses.AddRange(defaultAddress, anotherAddress);
            await _dbContext.SaveChangesAsync();

            var command = new UpdateUserAddressCommand 
            { 
                CurrentUserId = userId, 
                Id = defaultAddress.Id,
                ContactName = "New",
                ContactPhone = "123",
                AddressLine = "New",
                IsDefault = false // Trying to unset
            };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            
            var address = await _dbContext.UserAddresses.FindAsync(defaultAddress.Id);
            address!.IsDefault.Should().BeFalse();
            
            var another = await _dbContext.UserAddresses.FindAsync(anotherAddress.Id);
            another!.IsDefault.Should().BeTrue();
        }
    }
}
