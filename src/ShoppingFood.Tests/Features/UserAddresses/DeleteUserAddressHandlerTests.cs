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
    public class DeleteUserAddressHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ShoppingFoodContext _dbContext;
        private readonly DeleteUserAddressHandler _handler;

        public DeleteUserAddressHandlerTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();
            var options = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseSqlite(_connection)
                .Options;
            _dbContext = new ShoppingFoodContext(options);
            _dbContext.Database.ExecuteSqlRaw("CREATE TABLE USER_ADDRESS (Id TEXT, UserAccountId TEXT, ContactName TEXT, ContactPhone TEXT, AddressLine TEXT, IsDefault INTEGER DEFAULT 0, Latitude REAL, Longitude REAL, CreatedAt TEXT, UpdatedAt TEXT, IsDeleted INTEGER DEFAULT 0)");

            _handler = new DeleteUserAddressHandler(_dbContext);
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task Handle_AddressNotFound_Returns404()
        {
            var command = new DeleteUserAddressCommand { CurrentUserId = Guid.NewGuid(), Id = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(404);
            result.Message.Should().Be("Không tìm thấy địa chỉ.");
        }

        [Fact]
        public async Task Handle_ValidDelete_Returns200()
        {
            var userId = Guid.NewGuid();
            var addressId = Guid.NewGuid();
            var address = new UserAddress { Id = addressId, UserAccountId = userId, AddressLine = "123 St" };
            
            _dbContext.UserAddresses.Add(address);
            await _dbContext.SaveChangesAsync();

            var command = new DeleteUserAddressCommand { CurrentUserId = userId, Id = addressId };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Đã xóa địa chỉ.");
            
            var exists = await _dbContext.UserAddresses.AnyAsync();
            exists.Should().BeFalse();
        }

        [Fact]
        public async Task Handle_DeleteDefaultAddress_SetsAnotherToDefault()
        {
            var userId = Guid.NewGuid();
            var defaultAddress = new UserAddress { Id = Guid.NewGuid(), UserAccountId = userId, AddressLine = "Default", IsDefault = true };
            var anotherAddress = new UserAddress { Id = Guid.NewGuid(), UserAccountId = userId, AddressLine = "Another", IsDefault = false };
            
            _dbContext.UserAddresses.AddRange(defaultAddress, anotherAddress);
            await _dbContext.SaveChangesAsync();

            var command = new DeleteUserAddressCommand { CurrentUserId = userId, Id = defaultAddress.Id };
            await _handler.Handle(command, CancellationToken.None);
            
            var remaining = await _dbContext.UserAddresses.FindAsync(anotherAddress.Id);
            remaining.Should().NotBeNull();
            remaining!.IsDefault.Should().BeTrue();
        }
    }
}
