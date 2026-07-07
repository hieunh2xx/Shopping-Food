using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Implementations;
using Xunit;

namespace ShoppingFood.Tests.Features.Users
{
    public class SellerHandlerTests : IDisposable
    {
        private readonly ShoppingFoodContext _dbContext;
        private readonly LogContext _logContext;
        private readonly UnitOfWork _unitOfWork;
        private readonly UserRepository _userRepository;
        private readonly SellerApplicationRepository _sellerApplicationRepository;
        private readonly NotificationRepository _notificationRepository;
        private readonly Mock<IMapper> _mapperMock;

        public SellerHandlerTests()
        {
            var dbOptions = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            var logOptions = new DbContextOptionsBuilder<LogContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _dbContext = new ShoppingFoodContext(dbOptions);
            _logContext = new LogContext(logOptions);

            _unitOfWork = new UnitOfWork(_dbContext, _logContext);
            _userRepository = new UserRepository(_dbContext);
            _sellerApplicationRepository = new SellerApplicationRepository(_dbContext);
            _notificationRepository = new NotificationRepository(_dbContext);
            _mapperMock = new Mock<IMapper>();
        }

        public void Dispose()
        {
            _dbContext.Database.EnsureDeleted();
            _logContext.Database.EnsureDeleted();
            _dbContext.Dispose();
            _logContext.Dispose();
            _unitOfWork.Dispose();
        }

        [Fact]
        public async Task AddSellerHandler_BypassToken_SavesUserAndApplicationSuccessfully()
        {
            // Arrange
            var handler = new AddSellerHandler(
                _userRepository,
                _sellerApplicationRepository,
                _unitOfWork,
                _mapperMock.Object,
                _dbContext
            );

            var command = new AddSellerCommand
            {
                UserName = "seller_bypass",
                Password = "password123",
                Email = "bypass@seller.com",
                Phone = "0999999999",
                BusinessName = "Bypass Shop",
                BusinessAddress = "456 Avenue",
                BusinessLicenseUrl = "http://license.url",
                ShopImageUrl = "http://shop.url",
                ContactInfo = "Contact info",
                OtpCode = "bypass" // bypass check
            };

            // Act
            var result = await handler.Handle(command, CancellationToken.None);

            // Assert
            result.Error.Should().BeFalse();
            result.Code.Should().Be(200);
            result.Message.Should().Be("Seller registration submitted successfully. Application is pending review.");

            // Verify DB saved entities
            var savedUser = await _dbContext.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.UserName == "seller_bypass");
            savedUser.Should().NotBeNull();
            savedUser!.Phone.Should().Be("0999999999");
            savedUser.Profile.Should().NotBeNull();
            savedUser.Profile!.Role.Should().Be(UserRole.Customer); // Customer is the default before approval

            var savedApp = await _dbContext.SellerApplications.FirstOrDefaultAsync(a => a.UserProfileId == savedUser.Profile.Id);
            savedApp.Should().NotBeNull();
            savedApp!.BusinessName.Should().Be("Bypass Shop");
            savedApp.Status.Should().Be(ApplicationStatus.Pending);
        }

        [Fact]
        public async Task AddSellerHandler_MissingToken_ReturnsBadRequest()
        {
            // Arrange
            var handler = new AddSellerHandler(
                _userRepository,
                _sellerApplicationRepository,
                _unitOfWork,
                _mapperMock.Object,
                _dbContext
            );

            var command = new AddSellerCommand
            {
                UserName = "seller_notoken",
                Password = "password123",
                Email = "notoken@seller.com",
                Phone = "0999999998",
                OtpCode = "" // triggers validation failure inside handler
            };

            // Act
            var result = await handler.Handle(command, CancellationToken.None);

            // Assert
            result.Error.Should().BeTrue();
            result.Code.Should().Be(400);
            result.Message.Should().Be("Firebase ID Token is required for registration.");
        }

        [Fact]
        public async Task ApplySellerHandler_UserNotLoggedIn_ReturnsUnauthorized()
        {
            // Arrange
            var handler = new ApplySellerHandler(
                _sellerApplicationRepository,
                _userRepository,
                _notificationRepository,
                _unitOfWork
            );

            var command = new ApplySellerCommand
            {
                CurrentUserId = null, // No logged-in user ID
                BusinessName = "My Business",
                BusinessAddress = "My Address"
            };

            // Act
            var result = await handler.Handle(command, CancellationToken.None);

            // Assert
            result.Error.Should().BeTrue();
            result.Code.Should().Be(401);
            result.Message.Should().Be("Unauthorized.");
        }

        [Fact]
        public async Task ApplySellerHandler_UserAlreadySeller_ReturnsBadRequest()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User
            {
                Id = userId,
                UserName = "existing_seller",
                Phone = "0111111111",
                Profile = new UserProfile
                {
                    Id = Guid.NewGuid(),
                    Role = UserRole.Seller // Already a seller
                }
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            var handler = new ApplySellerHandler(
                _sellerApplicationRepository,
                _userRepository,
                _notificationRepository,
                _unitOfWork
            );

            var command = new ApplySellerCommand
            {
                CurrentUserId = userId,
                BusinessName = "New Business",
                BusinessAddress = "New Address"
            };

            // Act
            var result = await handler.Handle(command, CancellationToken.None);

            // Assert
            result.Error.Should().BeTrue();
            result.Code.Should().Be(400);
            result.Message.Should().Be("You are already a seller or mall.");
        }

        [Fact]
        public async Task ApplySellerHandler_AlreadyHasPendingApplication_ReturnsBadRequest()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var profileId = Guid.NewGuid();
            var user = new User
            {
                Id = userId,
                UserName = "pending_user",
                Phone = "0111111112",
                Profile = new UserProfile
                {
                    Id = profileId,
                    Role = UserRole.Customer
                }
            };
            _dbContext.Users.Add(user);

            var pendingApp = new SellerApplication
            {
                Id = Guid.NewGuid(),
                UserProfileId = profileId,
                BusinessName = "Previous Business",
                BusinessAddress = "Previous Address",
                Type = ApplicationType.NewSeller,
                Status = ApplicationStatus.Pending
            };
            _dbContext.SellerApplications.Add(pendingApp);
            await _dbContext.SaveChangesAsync();

            var handler = new ApplySellerHandler(
                _sellerApplicationRepository,
                _userRepository,
                _notificationRepository,
                _unitOfWork
            );

            var command = new ApplySellerCommand
            {
                CurrentUserId = userId,
                BusinessName = "New Business",
                BusinessAddress = "New Address"
            };

            // Act
            var result = await handler.Handle(command, CancellationToken.None);

            // Assert
            result.Error.Should().BeTrue();
            result.Code.Should().Be(400);
            result.Message.Should().Be("You already have a pending seller application.");
        }

        [Fact]
        public async Task ApplySellerHandler_ValidRequest_SubmitsApplicationSuccessfully()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var profileId = Guid.NewGuid();
            var user = new User
            {
                Id = userId,
                UserName = "valid_user",
                Phone = "0111111113",
                Profile = new UserProfile
                {
                    Id = profileId,
                    Role = UserRole.Customer
                }
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            var handler = new ApplySellerHandler(
                _sellerApplicationRepository,
                _userRepository,
                _notificationRepository,
                _unitOfWork
            );

            var command = new ApplySellerCommand
            {
                CurrentUserId = userId,
                BusinessName = "Valid Shop",
                BusinessAddress = "789 Street",
                BusinessLicenseUrl = "http://license.png",
                ShopImageUrl = "http://shop.png",
                ContactInfo = "0111111113"
            };

            // Act
            var result = await handler.Handle(command, CancellationToken.None);

            // Assert
            result.Error.Should().BeFalse();
            result.Code.Should().Be(200);
            result.Message.Should().Be("Seller application submitted successfully.");

            // Verify application stored in DB
            var savedApp = await _dbContext.SellerApplications.FirstOrDefaultAsync(a => a.UserProfileId == profileId);
            savedApp.Should().NotBeNull();
            savedApp!.BusinessName.Should().Be("Valid Shop");
            savedApp.Status.Should().Be(ApplicationStatus.Pending);
        }
    }
}
