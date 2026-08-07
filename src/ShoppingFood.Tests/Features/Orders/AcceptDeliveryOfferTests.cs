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
    /// Unit tests for AcceptDeliveryOfferHandler.
    /// Step 4: External Shipper accepts a WaitingForShipper order → Status becomes Shipping.
    /// </summary>
    public class AcceptDeliveryOfferTests
    {
        private readonly Mock<IOrderRepository> _orderRepoMock;
        private readonly Mock<IShipperProfileRepository> _shipperRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<INotificationRepository> _notificationRepoMock;
        private readonly Mock<IOrderDeliveryProposalRepository> _proposalRepoMock;
        private readonly Mock<IOrderDispatchHistoryRepository> _historyRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly AcceptDeliveryOfferHandler _handler;

        public AcceptDeliveryOfferTests()
        {
            _orderRepoMock = new Mock<IOrderRepository>();
            _shipperRepoMock = new Mock<IShipperProfileRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _notificationRepoMock = new Mock<INotificationRepository>();
            _proposalRepoMock = new Mock<IOrderDeliveryProposalRepository>();
            _historyRepoMock = new Mock<IOrderDispatchHistoryRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();

            _handler = new AcceptDeliveryOfferHandler(
                _orderRepoMock.Object,
                _shipperRepoMock.Object,
                _userRepoMock.Object,
                _notificationRepoMock.Object,
                _proposalRepoMock.Object,
                _historyRepoMock.Object,
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
            _userRepoMock
                .Setup(r => r.GetAsync(It.IsAny<Expression<Func<User, bool>>>()))
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
            _shipperRepoMock
                .Setup(r => r.GetAsync(It.IsAny<Expression<Func<ShipperProfile, bool>>>()))
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
            _orderRepoMock
                .Setup(r => r.GetAsync(It.IsAny<Expression<Func<Order, bool>>>()))
                .ReturnsAsync(list.AsReadOnly());
        }

        private void SetupProposalRepo(OrderDeliveryProposal? proposal)
        {
            var list = proposal == null ? new List<OrderDeliveryProposal>() : new List<OrderDeliveryProposal> { proposal };
            _proposalRepoMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<OrderDeliveryProposal, bool>>>(),
                    It.IsAny<Func<IQueryable<OrderDeliveryProposal>, IOrderedQueryable<OrderDeliveryProposal>>>(),
                    It.IsAny<Func<IQueryable<OrderDeliveryProposal>, IIncludableQueryable<OrderDeliveryProposal, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(list.AsReadOnly());
            _proposalRepoMock
                .Setup(r => r.GetAsync(It.IsAny<Expression<Func<OrderDeliveryProposal, bool>>>()))
                .ReturnsAsync(list.AsReadOnly());
        }

        // ── UTC01 ─────────────────────────────────────────────────────────────
        // Abnormal: CurrentUserId is null → 401
        [Fact]
        public async Task Handle_NoCurrentUserId_Returns401()
        {
            var command = new AcceptDeliveryOfferCommand { OrderId = Guid.NewGuid(), CurrentUserId = null };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(401);
            result.Message.Should().Be("Unauthorized.");
        }

        // ── UTC02 ─────────────────────────────────────────────────────────────
        // Abnormal: User is not a shipper → 403
        [Fact]
        public async Task Handle_UserNotShipper_Returns403()
        {
            var userId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Role = UserRole.Customer } };
            SetupUserRepo(user);
            
            var command = new AcceptDeliveryOfferCommand { OrderId = Guid.NewGuid(), CurrentUserId = userId };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(403);
            result.Message.Should().Be("Forbidden. Only shipper can perform this action.");
        }

        // ── UTC03 ─────────────────────────────────────────────────────────────
        // Abnormal: Shipper is offline → 400
        [Fact]
        public async Task Handle_ShipperOffline_Returns400()
        {
            var userId = Guid.NewGuid();
            var userProfileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = userProfileId, Role = UserRole.Shipper } };
            var shipper = new ShipperProfile { Id = Guid.NewGuid(), UserProfileId = userProfileId, IsOnline = false };
            
            SetupUserRepo(user);
            SetupShipperRepo(shipper);
            
            var command = new AcceptDeliveryOfferCommand { OrderId = Guid.NewGuid(), CurrentUserId = userId };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(400);
            result.Message.Should().Be("Drivers must switch to online status to receive orders.");
        }

        // ── UTC04 ─────────────────────────────────────────────────────────────
        // Abnormal: Order not found → 404
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
            
            var command = new AcceptDeliveryOfferCommand { OrderId = Guid.NewGuid(), CurrentUserId = userId };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(404);
            result.Message.Should().Be("Order not found.");
        }

        // ── UTC05 ─────────────────────────────────────────────────────────────
        // Abnormal: Order already taken by another shipper → 400
        [Fact]
        public async Task Handle_OrderAlreadyTaken_Returns400()
        {
            var userId = Guid.NewGuid();
            var userProfileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = userProfileId, Role = UserRole.Shipper } };
            var shipper = new ShipperProfile { Id = Guid.NewGuid(), UserProfileId = userProfileId, IsOnline = true };
            var order = new Order { Id = Guid.NewGuid(), ShipperId = Guid.NewGuid(), Status = OrderStatus.WaitingForShipper };
            
            SetupUserRepo(user);
            SetupShipperRepo(shipper);
            SetupOrderRepo(order);
            
            var command = new AcceptDeliveryOfferCommand { OrderId = order.Id, CurrentUserId = userId };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(400);
            result.Message.Should().Be("This order has been accepted by another driver.");
        }

        // ── UTC06 ─────────────────────────────────────────────────────────────
        // Abnormal: Order not in WaitingForShipper status → 400
        [Fact]
        public async Task Handle_OrderNotWaitingForShipper_Returns400()
        {
            var userId = Guid.NewGuid();
            var userProfileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = userProfileId, Role = UserRole.Shipper } };
            var shipper = new ShipperProfile { Id = Guid.NewGuid(), UserProfileId = userProfileId, IsOnline = true };
            var order = new Order { Id = Guid.NewGuid(), ShipperId = null, Status = OrderStatus.Preparing };
            
            SetupUserRepo(user);
            SetupShipperRepo(shipper);
            SetupOrderRepo(order);
            
            var command = new AcceptDeliveryOfferCommand { OrderId = order.Id, CurrentUserId = userId };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(400);
            result.Message.Should().Contain("The order is not in waiting for shipper status.");
        }

        // ── UTC07 ─────────────────────────────────────────────────────────────
        // Normal: Valid shipper accepts waiting order → 200, status Shipping
        [Fact]
        public async Task Handle_ValidShipperAcceptsOrder_Returns200AndShipping()
        {
            var userId = Guid.NewGuid();
            var userProfileId = Guid.NewGuid();
            var userProfile = new UserProfile { Id = userProfileId, Role = UserRole.Shipper, FullName = "Shipper Test" };
            var user = new User { Id = userId, Profile = userProfile };
            var shipper = new ShipperProfile { Id = Guid.NewGuid(), UserProfileId = userProfileId, IsOnline = true, UserProfile = userProfile };
            var order = new Order { Id = Guid.NewGuid(), ShipperId = null, Status = OrderStatus.WaitingForShipper, UserAccountId = Guid.NewGuid() };
            
            SetupUserRepo(user);
            SetupShipperRepo(shipper);
            SetupOrderRepo(order);
            SetupProposalRepo(null); // No existing proposal
            
            _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
            
            var command = new AcceptDeliveryOfferCommand { OrderId = order.Id, CurrentUserId = userId, Latitude = 10.0, Longitude = 106.0 };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200, $"failed with message: {result.Message}");
            result.Message.Should().Be("Successfully received the single delivery proposal.");
            order.Status.Should().Be(OrderStatus.Shipping);
            order.ShipperId.Should().Be(shipper.Id);
            
            _orderRepoMock.Verify(r => r.Update(order), Times.Once);
            _shipperRepoMock.Verify(r => r.Update(shipper), Times.Once);
            _notificationRepoMock.Verify(r => r.Add(It.IsAny<Notification>()), Times.Once);
            _proposalRepoMock.Verify(r => r.Add(It.IsAny<OrderDeliveryProposal>()), Times.Once);
            _historyRepoMock.Verify(r => r.Add(It.IsAny<OrderDispatchHistory>()), Times.Once);
        }

        // ── UTC08 ─────────────────────────────────────────────────────────────
        // Abnormal: Exception thrown → 400
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
                
            var command = new AcceptDeliveryOfferCommand { OrderId = Guid.NewGuid(), CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Contain("An error occurred");
        }
    }
}
