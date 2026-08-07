using Microsoft.EntityFrameworkCore;
using Moq;
using ShoppingFood.Application.Features.Admin.Commands;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace ShoppingFood.Tests.Features.Admin
{
    public class ApproveShipperApplicationHandlerTests : IDisposable
    {
        private readonly Mock<IShipperApplicationRepository> _mockShipperApplicationRepo;
        private readonly Mock<IShipperProfileRepository> _mockShipperProfileRepo;
        private readonly Mock<IUserRepository> _mockUserRepo;
        private readonly Mock<INotificationRepository> _mockNotificationRepo;
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<INotificationPushService> _mockNotificationPushService;
        private readonly ShoppingFoodContext _dbContext;
        private readonly ApproveShipperApplicationHandler _handler;

        public ApproveShipperApplicationHandlerTests()
        {
            _mockShipperApplicationRepo = new Mock<IShipperApplicationRepository>();
            _mockShipperProfileRepo = new Mock<IShipperProfileRepository>();
            _mockUserRepo = new Mock<IUserRepository>();
            _mockNotificationRepo = new Mock<INotificationRepository>();
            _mockEmailService = new Mock<IEmailService>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockNotificationPushService = new Mock<INotificationPushService>();

            var options = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .ConfigureWarnings(x => x.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
                .Options;
            _dbContext = new ShoppingFoodContext(options);

            _handler = new ApproveShipperApplicationHandler(
                _mockShipperApplicationRepo.Object,
                _mockShipperProfileRepo.Object,
                _mockUserRepo.Object,
                _mockNotificationRepo.Object,
                _mockEmailService.Object,
                _mockUnitOfWork.Object,
                _dbContext,
                _mockNotificationPushService.Object
            );
        }

        public void Dispose()
        {
            _dbContext.Database.EnsureDeleted();
            _dbContext.Dispose();
        }

        [Fact]
        public async Task Handle_UnauthorizedUser_Returns401()
        {
            var command = new ApproveShipperApplicationCommand { CurrentUserId = null };
            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.True(result.Error);
            Assert.Equal(401, result.Code);
            Assert.Equal("Unauthorized.", result.Message);
        }

        [Fact]
        public async Task Handle_ApplicationNotFound_Returns404()
        {
            var currentUserId = Guid.NewGuid();
            var applicationId = Guid.NewGuid();
            var command = new ApproveShipperApplicationCommand { CurrentUserId = currentUserId, ApplicationId = applicationId };

            var adminUser = new User { Id = currentUserId, Profile = new UserProfile { Id = Guid.NewGuid() } };
            _mockUserRepo.Setup(x => x.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { adminUser });

            _mockShipperApplicationRepo.Setup(x => x.GetAsync(
                It.IsAny<Expression<Func<ShipperApplication, bool>>>(),
                It.IsAny<Func<IQueryable<ShipperApplication>, IOrderedQueryable<ShipperApplication>>?>(),
                It.IsAny<Func<IQueryable<ShipperApplication>, Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<ShipperApplication, object>>?>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()
            )).ReturnsAsync(new List<ShipperApplication>());

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.True(result.Error);
            Assert.Equal(404, result.Code);
            Assert.Equal("Application not found", result.Message);
        }

        [Fact]
        public async Task Handle_ApproveShipper_Success()
        {
            var currentUserId = Guid.NewGuid();
            var adminProfileId = Guid.NewGuid();
            var applicationId = Guid.NewGuid();
            var userAccountId = Guid.NewGuid();

            var command = new ApproveShipperApplicationCommand 
            { 
                CurrentUserId = currentUserId, 
                ApplicationId = applicationId,
                Action = "Approve"
            };

            var adminUser = new User { Id = currentUserId, Profile = new UserProfile { Id = adminProfileId } };
            _mockUserRepo.Setup(x => x.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { adminUser });

            var application = new ShipperApplication 
            { 
                Id = applicationId, 
                Status = ApplicationStatus.Pending,
                UserProfile = new UserProfile 
                { 
                    UserAccountId = userAccountId,
                    UserAccount = new User { Id = userAccountId, Email = "shipper@test.com" }
                }
            };

            _mockShipperApplicationRepo.Setup(x => x.GetAsync(
                It.IsAny<Expression<Func<ShipperApplication, bool>>>(),
                It.IsAny<Func<IQueryable<ShipperApplication>, IOrderedQueryable<ShipperApplication>>?>(),
                It.IsAny<Func<IQueryable<ShipperApplication>, Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<ShipperApplication, object>>?>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()
            )).ReturnsAsync(new List<ShipperApplication> { application });

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.False(result.Error);
            Assert.Equal(ApplicationStatus.Approved, application.Status);
            Assert.Equal(UserRole.Shipper, application.UserProfile.Role);
            Assert.Equal(adminProfileId, application.ReviewedBy);
            
            _mockUserRepo.Verify(x => x.Update(It.IsAny<User>()), Times.Once);
            _mockShipperProfileRepo.Verify(x => x.Add(It.IsAny<ShipperProfile>()), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
            _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Once);
            _mockNotificationPushService.Verify(x => x.PushToUserAsync(userAccountId, It.IsAny<object>(), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task Handle_RejectShipper_Success()
        {
            var currentUserId = Guid.NewGuid();
            var adminProfileId = Guid.NewGuid();
            var applicationId = Guid.NewGuid();

            var command = new ApproveShipperApplicationCommand 
            { 
                CurrentUserId = currentUserId, 
                ApplicationId = applicationId,
                Action = "Reject",
                RejectionReason = "Invalid license"
            };

            var adminUser = new User { Id = currentUserId, Profile = new UserProfile { Id = adminProfileId } };
            _mockUserRepo.Setup(x => x.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { adminUser });

            var application = new ShipperApplication 
            { 
                Id = applicationId, 
                Status = ApplicationStatus.Pending,
                UserProfile = new UserProfile 
                { 
                    UserAccountId = Guid.NewGuid(),
                    UserAccount = new User { Email = "shipper@test.com" }
                }
            };

            _mockShipperApplicationRepo.Setup(x => x.GetAsync(
                It.IsAny<Expression<Func<ShipperApplication, bool>>>(),
                It.IsAny<Func<IQueryable<ShipperApplication>, IOrderedQueryable<ShipperApplication>>?>(),
                It.IsAny<Func<IQueryable<ShipperApplication>, Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<ShipperApplication, object>>?>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()
            )).ReturnsAsync(new List<ShipperApplication> { application });

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.False(result.Error);
            Assert.Equal(ApplicationStatus.Rejected, application.Status);
            Assert.Equal("Invalid license", application.RejectionReason);
            
            _mockShipperProfileRepo.Verify(x => x.Add(It.IsAny<ShipperProfile>()), Times.Never);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }
    }
}
