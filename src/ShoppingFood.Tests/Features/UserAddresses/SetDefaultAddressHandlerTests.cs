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
    public class SetDefaultAddressHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ShoppingFoodContext _dbContext;
        private readonly SetDefaultAddressHandler _handler;

        public SetDefaultAddressHandlerTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();
            var options = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseSqlite(_connection)
                .Options;
            _dbContext = new ShoppingFoodContext(options);
            _dbContext.Database.ExecuteSqlRaw("CREATE TABLE USER_ADDRESS (Id TEXT, UserAccountId TEXT, ContactName TEXT, ContactPhone TEXT, AddressLine TEXT, IsDefault INTEGER DEFAULT 0, Latitude REAL, Longitude REAL, CreatedAt TEXT, UpdatedAt TEXT, IsDeleted INTEGER DEFAULT 0)");

            _handler = new SetDefaultAddressHandler(_dbContext);
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task Handle_AddressNotFound_Returns404()
        {
            var command = new SetDefaultAddressCommand { CurrentUserId = Guid.NewGuid(), Id = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(404);
            result.Message.Should().Be("Không tìm thấy địa chỉ.");
        }

        [Fact]
        public async Task Handle_AddressNotDefault_SetsToDefaultAndUnsetsOthers()
        {
            var userId = Guid.NewGuid();
            var defaultAddress = new UserAddress { Id = Guid.NewGuid(), UserAccountId = userId, AddressLine = "Default", IsDefault = true };
            var anotherAddress = new UserAddress { Id = Guid.NewGuid(), UserAccountId = userId, AddressLine = "Another", IsDefault = false };
            
            _dbContext.UserAddresses.AddRange(defaultAddress, anotherAddress);
            await _dbContext.SaveChangesAsync();

            var command = new SetDefaultAddressCommand { CurrentUserId = userId, Id = anotherAddress.Id };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Đã đặt làm địa chỉ mặc định.");
            
            var oldDefault = await _dbContext.UserAddresses.FindAsync(defaultAddress.Id);
            oldDefault!.IsDefault.Should().BeFalse();
            
            var newDefault = await _dbContext.UserAddresses.FindAsync(anotherAddress.Id);
            newDefault!.IsDefault.Should().BeTrue();
        }

        [Fact]
        public async Task Handle_AddressAlreadyDefault_DoesNothing()
        {
            var userId = Guid.NewGuid();
            var defaultAddress = new UserAddress { Id = Guid.NewGuid(), UserAccountId = userId, AddressLine = "Default", IsDefault = true };
            
            _dbContext.UserAddresses.Add(defaultAddress);
            await _dbContext.SaveChangesAsync();

            var command = new SetDefaultAddressCommand { CurrentUserId = userId, Id = defaultAddress.Id };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Đã đặt làm địa chỉ mặc định.");
            
            var address = await _dbContext.UserAddresses.FindAsync(defaultAddress.Id);
            address!.IsDefault.Should().BeTrue();
        }
    }
}
