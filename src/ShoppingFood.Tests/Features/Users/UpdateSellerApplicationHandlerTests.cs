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
    public class UpdateSellerApplicationHandlerTests
    {
        private readonly Mock<ISellerApplicationRepository> _sellerAppRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IUnitOfWork> _uowMock;
        private readonly Mock<INotificationPushService> _pushMock;
        private readonly Mock<INotificationRepository> _notificationRepoMock;
        private readonly UpdateSellerApplicationHandler _handler;

        public UpdateSellerApplicationHandlerTests()
        {
            _sellerAppRepoMock = new Mock<ISellerApplicationRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _uowMock = new Mock<IUnitOfWork>();
            _pushMock = new Mock<INotificationPushService>();
            _notificationRepoMock = new Mock<INotificationRepository>();

            _handler = new UpdateSellerApplicationHandler(
                _sellerAppRepoMock.Object,
                _userRepoMock.Object,
                _uowMock.Object,
                _pushMock.Object,
                _notificationRepoMock.Object
            );
        }

        [Fact]
        public async Task Handle_NullUserId_Returns401()
        {
            var command = new UpdateSellerApplicationCommand { CurrentUserId = null };
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

            var command = new UpdateSellerApplicationCommand { CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(404);
            result.Message.Should().Be("User profile not found.");
        }

        [Fact]
        public async Task Handle_ApplicationNotFound_Returns404()
        {
            var userId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = Guid.NewGuid() } };

            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { user });

            _sellerAppRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<SellerApplication, bool>>>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IOrderedQueryable<SellerApplication>>?>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IIncludableQueryable<SellerApplication, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<SellerApplication>());

            var command = new UpdateSellerApplicationCommand { CurrentUserId = userId, Id = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(404);
            result.Message.Should().Be("Seller application not found.");
        }

        [Fact]
        public async Task Handle_NotOwnedApplication_Returns403()
        {
            var userId = Guid.NewGuid();
            var profileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = profileId } };

            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { user });

            var app = new SellerApplication { Id = Guid.NewGuid(), UserProfileId = Guid.NewGuid() }; // Different profile ID

            _sellerAppRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<SellerApplication, bool>>>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IOrderedQueryable<SellerApplication>>?>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IIncludableQueryable<SellerApplication, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<SellerApplication> { app });

            var command = new UpdateSellerApplicationCommand { CurrentUserId = userId, Id = app.Id };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(403);
            result.Message.Should().Be("Forbidden. You do not own this application.");
        }

        [Fact]
        public async Task Handle_ApprovedApplication_Returns400()
        {
            var userId = Guid.NewGuid();
            var profileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = profileId } };

            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { user });

            var app = new SellerApplication { Id = Guid.NewGuid(), UserProfileId = profileId, Status = ApplicationStatus.Approved };

            _sellerAppRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<SellerApplication, bool>>>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IOrderedQueryable<SellerApplication>>?>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IIncludableQueryable<SellerApplication, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<SellerApplication> { app });

            var command = new UpdateSellerApplicationCommand { CurrentUserId = userId, Id = app.Id };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Contain("Cannot update application. Current status is Approved");
        }

        [Fact]
        public async Task Handle_RejectedApplication_Returns400()
        {
            var userId = Guid.NewGuid();
            var profileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = profileId } };

            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { user });

            var app = new SellerApplication { Id = Guid.NewGuid(), UserProfileId = profileId, Status = ApplicationStatus.Rejected };

            _sellerAppRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<SellerApplication, bool>>>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IOrderedQueryable<SellerApplication>>?>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IIncludableQueryable<SellerApplication, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<SellerApplication> { app });

            var command = new UpdateSellerApplicationCommand { CurrentUserId = userId, Id = app.Id };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Your application has been rejected and cannot be updated.");
        }

        [Fact]
        public async Task Handle_Success_Returns200()
        {
            var userId = Guid.NewGuid();
            var profileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = profileId, FullName = "Test User" } };

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
                var isForCurrentUser = predicate.Compile().Invoke(user);
                if (isForCurrentUser)
                {
                    return new List<User> { user };
                }

                var admin = new User { Id = Guid.NewGuid(), Profile = new UserProfile { Role = UserRole.Admin } };
                return new List<User> { admin };
            });

            var app = new SellerApplication { Id = Guid.NewGuid(), UserProfileId = profileId, Status = ApplicationStatus.Pending, Type = ApplicationType.NewSeller };

            _sellerAppRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<SellerApplication, bool>>>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IOrderedQueryable<SellerApplication>>?>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IIncludableQueryable<SellerApplication, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<SellerApplication> { app });

            var command = new UpdateSellerApplicationCommand 
            { 
                CurrentUserId = userId, 
                Id = app.Id,
                BusinessName = "Updated Name"
            };
            
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Seller application updated and resubmitted successfully");
            
            app.BusinessName.Should().Be("Updated Name");
            app.Status.Should().Be(ApplicationStatus.Pending);

            _sellerAppRepoMock.Verify(r => r.Update(app), Times.Once);
            _notificationRepoMock.Verify(r => r.Add(It.IsAny<Notification>()), Times.AtLeastOnce);
            _pushMock.Verify(p => p.PushToUserAsync(It.IsAny<Guid>(), It.IsAny<object>(), It.IsAny<CancellationToken>()), Times.AtLeastOnce);
            _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }
    }
}
