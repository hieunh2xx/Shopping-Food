using AutoMapper;
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
    public class ApproveApplicationHandlerTests : IDisposable
    {
        private readonly Mock<ISellerApplicationRepository> _mockSellerApplicationRepo;
        private readonly Mock<IRestaurantProfileRepository> _mockRestaurantProfileRepo;
        private readonly Mock<IUserRepository> _mockUserRepo;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IMapper> _mockMapper;
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly Mock<INotificationRepository> _mockNotificationRepo;
        private readonly Mock<INotificationPushService> _mockNotificationPushService;
        private readonly ShoppingFoodContext _dbContext;
        private readonly ApproveApplicationHandler _handler;

        public ApproveApplicationHandlerTests()
        {
            _mockSellerApplicationRepo = new Mock<ISellerApplicationRepository>();
            _mockRestaurantProfileRepo = new Mock<IRestaurantProfileRepository>();
            _mockUserRepo = new Mock<IUserRepository>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockMapper = new Mock<IMapper>();
            _mockEmailService = new Mock<IEmailService>();
            _mockNotificationRepo = new Mock<INotificationRepository>();
            _mockNotificationPushService = new Mock<INotificationPushService>();

            var options = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .ConfigureWarnings(x => x.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
                .Options;
            _dbContext = new ShoppingFoodContext(options);

            _handler = new ApproveApplicationHandler(
                _mockSellerApplicationRepo.Object,
                _mockRestaurantProfileRepo.Object,
                _mockUserRepo.Object,
                _mockUnitOfWork.Object,
                _mockMapper.Object,
                _mockEmailService.Object,
                _mockNotificationRepo.Object,
                _mockNotificationPushService.Object,
                _dbContext
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
            var command = new ApproveApplicationCommand { CurrentUserId = null };
            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.True(result.Error);
            Assert.Equal(401, result.Code);
            Assert.Equal("User is unauthorized.", result.Message);
        }

        [Fact]
        public async Task Handle_AdminProfileNotFound_Returns401()
        {
            var currentUserId = Guid.NewGuid();
            var command = new ApproveApplicationCommand { CurrentUserId = currentUserId };

            _mockUserRepo.Setup(x => x.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()
            )).ReturnsAsync(new List<User>());

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.True(result.Error);
            Assert.Equal(401, result.Code);
            Assert.Equal("User profile not found.", result.Message);
        }

        [Fact]
        public async Task Handle_ApplicationNotFound_Returns404()
        {
            var currentUserId = Guid.NewGuid();
            var applicationId = Guid.NewGuid();
            var command = new ApproveApplicationCommand { CurrentUserId = currentUserId, ApplicationId = applicationId };

            var adminUser = new User { Id = currentUserId, Profile = new UserProfile { Id = Guid.NewGuid() } };
            _mockUserRepo.Setup(x => x.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { adminUser });

            _mockSellerApplicationRepo.Setup(x => x.GetAsync(
                It.IsAny<Expression<Func<SellerApplication, bool>>>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IOrderedQueryable<SellerApplication>>?>(),
                It.IsAny<Func<IQueryable<SellerApplication>, Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<SellerApplication, object>>?>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()
            )).ReturnsAsync(new List<SellerApplication>());

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.True(result.Error);
            Assert.Equal(404, result.Code);
            Assert.Contains("was not found", result.Message);
        }

        [Fact]
        public async Task Handle_ApplicationAlreadyProcessed_Returns400()
        {
            var currentUserId = Guid.NewGuid();
            var applicationId = Guid.NewGuid();
            var command = new ApproveApplicationCommand { CurrentUserId = currentUserId, ApplicationId = applicationId };

            var adminUser = new User { Id = currentUserId, Profile = new UserProfile { Id = Guid.NewGuid() } };
            _mockUserRepo.Setup(x => x.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { adminUser });

            var application = new SellerApplication { Id = applicationId, Status = ApplicationStatus.Approved };
            _mockSellerApplicationRepo.Setup(x => x.GetAsync(
                It.IsAny<Expression<Func<SellerApplication, bool>>>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IOrderedQueryable<SellerApplication>>?>(),
                It.IsAny<Func<IQueryable<SellerApplication>, Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<SellerApplication, object>>?>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()
            )).ReturnsAsync(new List<SellerApplication> { application });

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.True(result.Error);
            Assert.Equal(400, result.Code);
            Assert.Contains("already processed", result.Message);
        }

        [Fact]
        public async Task Handle_ApproveNewSeller_Success()
        {
            var currentUserId = Guid.NewGuid();
            var adminProfileId = Guid.NewGuid();
            var applicationId = Guid.NewGuid();
            var userProfileId = Guid.NewGuid();
            var userAccountId = Guid.NewGuid();

            var command = new ApproveApplicationCommand 
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

            var application = new SellerApplication 
            { 
                Id = applicationId, 
                Status = ApplicationStatus.Pending,
                Type = ApplicationType.NewSeller,
                UserProfileId = userProfileId,
                BusinessName = "Test Shop",
                UserProfile = new UserProfile 
                { 
                    Id = userProfileId, 
                    Role = UserRole.Customer,
                    UserAccountId = userAccountId,
                    UserAccount = new User { Id = userAccountId, Email = "test@shop.com" }
                }
            };

            _mockSellerApplicationRepo.Setup(x => x.GetAsync(
                It.IsAny<Expression<Func<SellerApplication, bool>>>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IOrderedQueryable<SellerApplication>>?>(),
                It.IsAny<Func<IQueryable<SellerApplication>, Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<SellerApplication, object>>?>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()
            )).ReturnsAsync(new List<SellerApplication> { application });

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.False(result.Error);
            Assert.Equal(ApplicationStatus.Approved, application.Status);
            Assert.Equal(UserRole.Seller, application.UserProfile.Role);
            Assert.Equal(adminProfileId, application.ReviewedBy);
            
            _mockUserRepo.Verify(x => x.Update(It.IsAny<User>()), Times.Once);
            _mockRestaurantProfileRepo.Verify(x => x.Add(It.IsAny<RestaurantProfile>()), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
            _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Once);
            _mockNotificationPushService.Verify(x => x.PushToUserAsync(userAccountId, It.IsAny<object>(), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task Handle_RejectApplication_Success()
        {
            var currentUserId = Guid.NewGuid();
            var adminProfileId = Guid.NewGuid();
            var applicationId = Guid.NewGuid();

            var command = new ApproveApplicationCommand 
            { 
                CurrentUserId = currentUserId, 
                ApplicationId = applicationId,
                Action = "Reject",
                RejectionReason = "Invalid documents"
            };

            var adminUser = new User { Id = currentUserId, Profile = new UserProfile { Id = adminProfileId } };
            _mockUserRepo.Setup(x => x.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { adminUser });

            var application = new SellerApplication 
            { 
                Id = applicationId, 
                Status = ApplicationStatus.Pending,
                BusinessName = "Test Shop",
                UserProfile = new UserProfile 
                { 
                    UserAccountId = Guid.NewGuid(),
                    UserAccount = new User { Email = "test@shop.com" }
                }
            };

            _mockSellerApplicationRepo.Setup(x => x.GetAsync(
                It.IsAny<Expression<Func<SellerApplication, bool>>>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IOrderedQueryable<SellerApplication>>?>(),
                It.IsAny<Func<IQueryable<SellerApplication>, Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<SellerApplication, object>>?>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()
            )).ReturnsAsync(new List<SellerApplication> { application });

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.False(result.Error);
            Assert.Equal(ApplicationStatus.Rejected, application.Status);
            Assert.Equal("Invalid documents", application.RejectionReason);
            
            _mockRestaurantProfileRepo.Verify(x => x.Add(It.IsAny<RestaurantProfile>()), Times.Never);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }
    }
}
