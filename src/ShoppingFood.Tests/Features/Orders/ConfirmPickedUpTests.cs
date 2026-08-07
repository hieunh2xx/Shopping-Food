using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore.Query;
using Moq;
using ShoppingFood.Application.Features.Orders.Commands;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Orders
{
    /// <summary>
    /// Unit tests for ConfirmPickedUpHandler.
    /// Step 6: Shipper confirms picking up order with verification code.
    /// </summary>
    public class ConfirmPickedUpTests
    {
        private readonly Mock<IOrderRepository> _orderRepoMock;
        private readonly Mock<IShipperProfileRepository> _shipperRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<INotificationRepository> _notificationRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly ConfirmPickedUpHandler _handler;

        public ConfirmPickedUpTests()
        {
            _orderRepoMock = new Mock<IOrderRepository>();
            _shipperRepoMock = new Mock<IShipperProfileRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _notificationRepoMock = new Mock<INotificationRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();

            _handler = new ConfirmPickedUpHandler(
                _orderRepoMock.Object,
                _shipperRepoMock.Object,
                _userRepoMock.Object,
                _notificationRepoMock.Object,
                _unitOfWorkMock.Object
            );
        }

        private void SetupUserRepo(User? user)
        {
            var list = user == null ? new List<User>() : new List<User> { user };
            _userRepoMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<User, bool>>>(),
                    It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>>(),
                    It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(list.AsReadOnly());
        }

        private void SetupShipperRepo(ShipperProfile? shipper)
        {
            var list = shipper == null ? new List<ShipperProfile>() : new List<ShipperProfile> { shipper };
            _shipperRepoMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<ShipperProfile, bool>>>(),
                    It.IsAny<Func<IQueryable<ShipperProfile>, IOrderedQueryable<ShipperProfile>>>(),
                    It.IsAny<Func<IQueryable<ShipperProfile>, IIncludableQueryable<ShipperProfile, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(list.AsReadOnly());
        }

        private void SetupOrderRepo(Order? order)
        {
            var list = order == null ? new List<Order>() : new List<Order> { order };
            _orderRepoMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Order, bool>>>(),
                    It.IsAny<Func<IQueryable<Order>, IOrderedQueryable<Order>>>(),
                    It.IsAny<Func<IQueryable<Order>, IIncludableQueryable<Order, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(list.AsReadOnly());
        }

        // ── UTC01 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_NoCurrentUserId_Returns401()
        {
            var command = new ConfirmPickedUpCommand { OrderId = Guid.NewGuid(), CurrentUserId = null };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(401);
        }

        // ── UTC02 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_UserNotShipper_Returns403()
        {
            var userId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Role = UserRole.Customer } };
            SetupUserRepo(user);
            
            var command = new ConfirmPickedUpCommand { OrderId = Guid.NewGuid(), CurrentUserId = userId };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(403);
        }

        // ── UTC03 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_ShipperOffline_Returns400()
        {
            var userId = Guid.NewGuid();
            var userProfileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = userProfileId, Role = UserRole.Shipper } };
            var shipper = new ShipperProfile { Id = Guid.NewGuid(), UserProfileId = userProfileId, IsOnline = false };
            
            SetupUserRepo(user);
            SetupShipperRepo(shipper);
            
            var command = new ConfirmPickedUpCommand { OrderId = Guid.NewGuid(), CurrentUserId = userId };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(400);
            result.Message.Should().Contain("must switch to online");
        }

        // ── UTC04 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_OrderNotFound_Returns404()
        {
            var userId = Guid.NewGuid();
            var userProfileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = userProfileId, Role = UserRole.Shipper } };
            var shipper = new ShipperProfile { Id = Guid.NewGuid(), UserProfileId = userProfileId, IsOnline = true };
            
            SetupUserRepo(user);
            SetupShipperRepo(shipper);
            SetupOrderRepo(null);
            
            var command = new ConfirmPickedUpCommand { OrderId = Guid.NewGuid(), CurrentUserId = userId };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(404);
        }

        // ── UTC05 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_OrderNotAssignedToShipper_Returns403()
        {
            var userId = Guid.NewGuid();
            var userProfileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = userProfileId, Role = UserRole.Shipper } };
            var shipper = new ShipperProfile { Id = Guid.NewGuid(), UserProfileId = userProfileId, IsOnline = true };
            var order = new Order { Id = Guid.NewGuid(), ShipperId = Guid.NewGuid() }; // Assigned to someone else
            
            SetupUserRepo(user);
            SetupShipperRepo(shipper);
            SetupOrderRepo(order);
            
            var command = new ConfirmPickedUpCommand { OrderId = order.Id, CurrentUserId = userId };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(403);
            result.Message.Should().Contain("not assigned to this order");
        }

        // ── UTC06 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_OrderStatusNotShipping_Returns400()
        {
            var userId = Guid.NewGuid();
            var userProfileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = userProfileId, Role = UserRole.Shipper } };
            var shipper = new ShipperProfile { Id = Guid.NewGuid(), UserProfileId = userProfileId, IsOnline = true };
            var order = new Order { Id = Guid.NewGuid(), ShipperId = shipper.Id, Status = OrderStatus.WaitingForShipper };
            
            SetupUserRepo(user);
            SetupShipperRepo(shipper);
            SetupOrderRepo(order);
            
            var command = new ConfirmPickedUpCommand { OrderId = order.Id, CurrentUserId = userId };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(400);
            result.Message.Should().Contain("Invalid order status");
        }

        // ── UTC07 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_WrongVerificationCode_Returns400()
        {
            var userId = Guid.NewGuid();
            var userProfileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = userProfileId, Role = UserRole.Shipper } };
            var shipper = new ShipperProfile { Id = Guid.NewGuid(), UserProfileId = userProfileId, IsOnline = true };
            var order = new Order { Id = Guid.NewGuid(), ShipperId = shipper.Id, Status = OrderStatus.Shipping };
            
            SetupUserRepo(user);
            SetupShipperRepo(shipper);
            SetupOrderRepo(order);
            
            var command = new ConfirmPickedUpCommand { OrderId = order.Id, CurrentUserId = userId, VerificationCode = "123456" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Contain("Invalid verification code");
        }

        // ── UTC08 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_CorrectVerificationCode_Returns200()
        {
            var userId = Guid.NewGuid();
            var userProfileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = userProfileId, Role = UserRole.Shipper, FullName = "Shipper" } };
            var shipper = new ShipperProfile { Id = Guid.NewGuid(), UserProfileId = userProfileId, IsOnline = true, UserProfile = user.Profile };
            var order = new Order { Id = Guid.NewGuid(), ShipperId = shipper.Id, Status = OrderStatus.Shipping, UserAccountId = Guid.NewGuid() };
            
            SetupUserRepo(user);
            SetupShipperRepo(shipper);
            SetupOrderRepo(order);
            
            _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
            
            string expectedCode = order.Id.ToString().Substring(order.Id.ToString().Length - 6);
            
            var command = new ConfirmPickedUpCommand { OrderId = order.Id, CurrentUserId = userId, VerificationCode = expectedCode, Latitude = 10.0, Longitude = 106.0 };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Contain("Food picked up successfully");
            
            _shipperRepoMock.Verify(r => r.Update(shipper), Times.Once);
            _notificationRepoMock.Verify(r => r.Add(It.IsAny<Notification>()), Times.Once);
        }

        // ── UTC09 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_ExceptionThrown_Returns400()
        {
            _userRepoMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<User, bool>>>(),
                    It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>>(),
                    It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ThrowsAsync(new Exception("Database down"));
                
            _unitOfWorkMock.Setup(u => u.LogErrorAsync(It.IsAny<string>(), It.IsAny<Exception>()))
                .Returns(Task.CompletedTask);
                
            var command = new ConfirmPickedUpCommand { OrderId = Guid.NewGuid(), CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Contain("An error occurred");
        }
    }
}
