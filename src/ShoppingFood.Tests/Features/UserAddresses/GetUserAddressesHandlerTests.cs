using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Features.UserAddresses.Queries;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.User;
using Xunit;

namespace ShoppingFood.Tests.Features.UserAddresses
{
    public class GetUserAddressesHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ShoppingFoodContext _dbContext;
        private readonly GetUserAddressesHandler _handler;

        public GetUserAddressesHandlerTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();
            var options = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseSqlite(_connection)
                .Options;
            _dbContext = new ShoppingFoodContext(options);
            _dbContext.Database.ExecuteSqlRaw("CREATE TABLE USER_ADDRESS (Id TEXT, UserAccountId TEXT, ContactName TEXT, ContactPhone TEXT, AddressLine TEXT, IsDefault INTEGER DEFAULT 0, Latitude REAL, Longitude REAL, CreatedAt TEXT, UpdatedAt TEXT, IsDeleted INTEGER DEFAULT 0)");

            _handler = new GetUserAddressesHandler(_dbContext);
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task Handle_ReturnsAddressesSortedByDefault()
        {
            var userId = Guid.NewGuid();
            var otherUserId = Guid.NewGuid();

            var addr1 = new UserAddress { Id = Guid.NewGuid(), UserAccountId = userId, AddressLine = "Normal", IsDefault = false };
            var addr2 = new UserAddress { Id = Guid.NewGuid(), UserAccountId = userId, AddressLine = "Default", IsDefault = true };
            var addr3 = new UserAddress { Id = Guid.NewGuid(), UserAccountId = otherUserId, AddressLine = "Other User", IsDefault = true };
            
            _dbContext.UserAddresses.AddRange(addr1, addr2, addr3);
            await _dbContext.SaveChangesAsync();

            var query = new GetUserAddressesQuery { CurrentUserId = userId };
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(200);
            
            var data = result.Data as List<UserAddressDto>;
            data.Should().NotBeNull();
            data!.Count.Should().Be(2); // Should not include other user's address
            
            // First one should be default
            data[0].IsDefault.Should().BeTrue();
            data[0].AddressLine.Should().Be("Default");
            
            // Second one should be non-default
            data[1].IsDefault.Should().BeFalse();
            data[1].AddressLine.Should().Be("Normal");
        }

        [Fact]
        public async Task Handle_NoAddresses_ReturnsEmptyList()
        {
            var query = new GetUserAddressesQuery { CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(200);
            var data = result.Data as List<UserAddressDto>;
            data.Should().NotBeNull();
            data!.Should().BeEmpty();
        }
    }
}
