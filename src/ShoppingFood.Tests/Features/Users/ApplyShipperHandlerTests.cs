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
    public class ApplyShipperHandlerTests
    {
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IShipperApplicationRepository> _shipperAppRepoMock;
        private readonly Mock<INotificationRepository> _notificationRepoMock;
        private readonly Mock<IUnitOfWork> _uowMock;
        private readonly ApplyShipperHandler _handler;

        public ApplyShipperHandlerTests()
        {
            _userRepoMock = new Mock<IUserRepository>();
            _shipperAppRepoMock = new Mock<IShipperApplicationRepository>();
            _notificationRepoMock = new Mock<INotificationRepository>();
            _uowMock = new Mock<IUnitOfWork>();

            _handler = new ApplyShipperHandler(
                _userRepoMock.Object,
                _shipperAppRepoMock.Object,
                _notificationRepoMock.Object,
                _uowMock.Object
            );
        }

        [Fact]
        public async Task Handle_NullUserId_Returns401()
        {
            var command = new ApplyShipperCommand { CurrentUserId = null };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(401);
            result.Message.Should().Be("Unauthorized.");
        }

        [Fact]
        public async Task Handle_UserProfileNotFound_Returns404()
        {
            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User>());

            var command = new ApplyShipperCommand { CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(404);
            result.Message.Should().Be("User profile not found.");
        }

        [Fact]
        public async Task Handle_NotCustomer_Returns403()
        {
            var userId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Role = UserRole.Seller } };

            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { user });

            var command = new ApplyShipperCommand { CurrentUserId = userId };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(403);
            result.Message.Should().Be("Only customer can apply to become a shipper.");
        }

        [Fact]
        public async Task Handle_HasPendingApplication_Returns400()
        {
            var userId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = Guid.NewGuid(), Role = UserRole.Customer } };

            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { user });

            _shipperAppRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Expression<Func<ShipperApplication, bool>>>()))
                .ReturnsAsync(true);

            var command = new ApplyShipperCommand { CurrentUserId = userId };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("You already have a pending shipper application.");
        }

        [Fact]
        public async Task Handle_Success_Returns200()
        {
            var userId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = Guid.NewGuid(), Role = UserRole.Customer, FullName = "Test User" } };

            // Setup for getting current user
            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync((Expression<Func<User, bool>> predicate, 
                             Func<IQueryable<User>, IOrderedQueryable<User>>? orderBy, 
                             Func<IQueryable<User>, IIncludableQueryable<User, object>>? include, 
                             int skip, int take, bool disableTracking) => 
            {
                // This mock will be called twice, once for current user, once for admins
                var isForCurrentUser = predicate.Compile().Invoke(user);
                if (isForCurrentUser)
                {
                    return new List<User> { user };
                }

                // Call for admins
                var admin = new User { Id = Guid.NewGuid(), Profile = new UserProfile { Role = UserRole.Admin } };
                return new List<User> { admin };
            });

            _shipperAppRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Expression<Func<ShipperApplication, bool>>>()))
                .ReturnsAsync(false);

            var command = new ApplyShipperCommand 
            { 
                CurrentUserId = userId,
                IdentityCardNumber = "123456789",
                VehicleType = VehicleType.Motorcycle
            };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Shipper application submitted successfully. Pending admin review");

            _shipperAppRepoMock.Verify(r => r.Add(It.IsAny<ShipperApplication>()), Times.Once);
            _notificationRepoMock.Verify(r => r.Add(It.IsAny<Notification>()), Times.AtLeastOnce);
            _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }
    }
}
