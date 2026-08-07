using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore.Query;
using Moq;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Users
{
    public class ToggleShipperOnlineHandlerTests
    {
        private readonly Mock<IShipperProfileRepository> _shipperProfileRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IUnitOfWork> _uowMock;
        private readonly ToggleShipperOnlineHandler _handler;

        public ToggleShipperOnlineHandlerTests()
        {
            _shipperProfileRepoMock = new Mock<IShipperProfileRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _uowMock = new Mock<IUnitOfWork>();

            _handler = new ToggleShipperOnlineHandler(
                _shipperProfileRepoMock.Object,
                _userRepoMock.Object,
                _uowMock.Object
            );
        }

        [Fact]
        public async Task Handle_NullUserId_Returns401()
        {
            var command = new ToggleShipperOnlineCommand { CurrentUserId = null, IsOnline = true };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(401);
            result.Message.Should().Be("Unauthorized.");
        }

        [Fact]
        public async Task Handle_NotShipperRole_Returns403()
        {
            var userId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Role = UserRole.Customer } };

            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { user });

            var command = new ToggleShipperOnlineCommand { CurrentUserId = userId, IsOnline = true };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(403);
            result.Message.Should().Be("Forbidden. Only shipper can toggle online status.");
        }

        [Fact]
        public async Task Handle_ShipperProfileNotFound_Returns404()
        {
            var userId = Guid.NewGuid();
            var profileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = profileId, Role = UserRole.Shipper } };

            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { user });

            _shipperProfileRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<ShipperProfile, bool>>>(),
                It.IsAny<Func<IQueryable<ShipperProfile>, IOrderedQueryable<ShipperProfile>>?>(),
                It.IsAny<Func<IQueryable<ShipperProfile>, IIncludableQueryable<ShipperProfile, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<ShipperProfile>());

            var command = new ToggleShipperOnlineCommand { CurrentUserId = userId, IsOnline = true };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(404);
            result.Message.Should().Be("Shipper profile not found.");
        }

        [Fact]
        public async Task Handle_PermanentlySuspended_Returns403()
        {
            var userId = Guid.NewGuid();
            var profileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = profileId, Role = UserRole.Shipper } };

            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { user });

            var shipperProfile = new ShipperProfile 
            { 
                UserProfileId = profileId, 
                Status = UserStatus.Active, 
                SuspendedUntil = DateTime.MaxValue, 
                SuspendedReason = "Fraud" 
            };
            
            _shipperProfileRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<ShipperProfile, bool>>>(),
                It.IsAny<Func<IQueryable<ShipperProfile>, IOrderedQueryable<ShipperProfile>>?>(),
                It.IsAny<Func<IQueryable<ShipperProfile>, IIncludableQueryable<ShipperProfile, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<ShipperProfile> { shipperProfile });

            var command = new ToggleShipperOnlineCommand { CurrentUserId = userId, IsOnline = true };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(403);
            result.Message.Should().Contain("Tài khoản của bạn đã bị khóa. Lý do: Fraud");
        }

        [Fact]
        public async Task Handle_TemporarilySuspended_Returns403()
        {
            var userId = Guid.NewGuid();
            var profileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = profileId, Role = UserRole.Shipper } };

            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { user });

            var shipperProfile = new ShipperProfile 
            { 
                UserProfileId = profileId, 
                Status = UserStatus.Active, 
                SuspendedUntil = DateTime.UtcNow.AddMinutes(30), 
                SuspendedReason = "Too many cancellations" 
            };
            
            _shipperProfileRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<ShipperProfile, bool>>>(),
                It.IsAny<Func<IQueryable<ShipperProfile>, IOrderedQueryable<ShipperProfile>>?>(),
                It.IsAny<Func<IQueryable<ShipperProfile>, IIncludableQueryable<ShipperProfile, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<ShipperProfile> { shipperProfile });

            var command = new ToggleShipperOnlineCommand { CurrentUserId = userId, IsOnline = true };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(403);
            result.Message.Should().Contain("Your account is temporarily suspended");
        }

        [Fact]
        public async Task Handle_SuspensionExpired_Success_Returns200()
        {
            var userId = Guid.NewGuid();
            var profileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = profileId, Role = UserRole.Shipper } };

            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { user });

            var shipperProfile = new ShipperProfile 
            { 
                UserProfileId = profileId, 
                Status = UserStatus.Active, 
                SuspendedUntil = DateTime.UtcNow.AddMinutes(-30), // Expired 30 mins ago
                SuspendedReason = "Should be cleared",
                IsOnline = false
            };
            
            _shipperProfileRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<ShipperProfile, bool>>>(),
                It.IsAny<Func<IQueryable<ShipperProfile>, IOrderedQueryable<ShipperProfile>>?>(),
                It.IsAny<Func<IQueryable<ShipperProfile>, IIncludableQueryable<ShipperProfile, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<ShipperProfile> { shipperProfile });

            var command = new ToggleShipperOnlineCommand { CurrentUserId = userId, IsOnline = true };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Shipper is now online and ready to receive orders.");
            
            shipperProfile.SuspendedUntil.Should().BeNull();
            shipperProfile.SuspendedReason.Should().BeNull();
            shipperProfile.IsOnline.Should().BeTrue();

            _shipperProfileRepoMock.Verify(r => r.Update(shipperProfile), Times.Exactly(2)); // Once for suspension clear, once for status update
            _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task Handle_Success_Returns200()
        {
            var userId = Guid.NewGuid();
            var profileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = profileId, Role = UserRole.Shipper } };

            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { user });

            var shipperProfile = new ShipperProfile 
            { 
                UserProfileId = profileId, 
                Status = UserStatus.Active,
                IsOnline = false
            };
            
            _shipperProfileRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<ShipperProfile, bool>>>(),
                It.IsAny<Func<IQueryable<ShipperProfile>, IOrderedQueryable<ShipperProfile>>?>(),
                It.IsAny<Func<IQueryable<ShipperProfile>, IIncludableQueryable<ShipperProfile, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<ShipperProfile> { shipperProfile });

            var command = new ToggleShipperOnlineCommand { CurrentUserId = userId, IsOnline = true };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Shipper is now online and ready to receive orders.");
            
            shipperProfile.IsOnline.Should().BeTrue();

            _shipperProfileRepoMock.Verify(r => r.Update(shipperProfile), Times.Once);
            _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }
    }
}
