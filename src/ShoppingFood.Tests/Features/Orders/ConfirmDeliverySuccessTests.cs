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
using ShoppingFood.Application.Services;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using Xunit;
using ShoppingFood.Application.Interfaces;

namespace ShoppingFood.Tests.Features.Orders
{
    /// <summary>
    /// Unit tests for ConfirmDeliverySuccessHandler.
    /// Step 7: Shipper confirms delivery success.
    /// </summary>
    public class ConfirmDeliverySuccessTests
    {
        private readonly Mock<IOrderRepository> _orderRepoMock;
        private readonly Mock<IShipperProfileRepository> _shipperRepoMock;
        private readonly Mock<INotificationRepository> _notificationRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<ILoyaltyPointRepository> _loyaltyRepoMock;
        private readonly Mock<ILoyaltyPointHistoryRepository> _loyaltyHistoryRepoMock;
        private readonly Mock<IMemberTierConfigRepository> _tierConfigRepoMock;
        private readonly Mock<IShipperReputationHistoryRepository> _reputationHistoryRepoMock;
        private readonly Mock<IPaymentSettlementService> _paymentMock;
        private readonly Mock<IChatSessionRepository> _chatSessionRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly ChatSessionCloseService _chatSessionCloseService;
        private readonly ConfirmDeliverySuccessHandler _handler;

        public ConfirmDeliverySuccessTests()
        {
            _orderRepoMock = new Mock<IOrderRepository>();
            _shipperRepoMock = new Mock<IShipperProfileRepository>();
            _notificationRepoMock = new Mock<INotificationRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _loyaltyRepoMock = new Mock<ILoyaltyPointRepository>();
            _loyaltyHistoryRepoMock = new Mock<ILoyaltyPointHistoryRepository>();
            _tierConfigRepoMock = new Mock<IMemberTierConfigRepository>();
            _reputationHistoryRepoMock = new Mock<IShipperReputationHistoryRepository>();
            _paymentMock = new Mock<IPaymentSettlementService>();
            _chatSessionRepoMock = new Mock<IChatSessionRepository>();
            _chatSessionRepoMock.Setup(r => r.GetAsync(It.IsAny<Expression<Func<ChatSession, bool>>>(), It.IsAny<Func<IQueryable<ChatSession>, IOrderedQueryable<ChatSession>>>(), It.IsAny<Func<IQueryable<ChatSession>, IIncludableQueryable<ChatSession, object>>>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<ChatSession>().AsReadOnly());
            _unitOfWorkMock = new Mock<IUnitOfWork>();

            _chatSessionCloseService = new ChatSessionCloseService(_chatSessionRepoMock.Object, _unitOfWorkMock.Object);

            _handler = new ConfirmDeliverySuccessHandler(
                _orderRepoMock.Object,
                _shipperRepoMock.Object,
                _notificationRepoMock.Object,
                _userRepoMock.Object,
                _loyaltyRepoMock.Object,
                _loyaltyHistoryRepoMock.Object,
                _tierConfigRepoMock.Object,
                _reputationHistoryRepoMock.Object,
                _paymentMock.Object,
                _chatSessionCloseService,
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
            var command = new ConfirmDeliverySuccessCommand { OrderId = Guid.NewGuid(), CurrentUserId = null };
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
            
            var command = new ConfirmDeliverySuccessCommand { OrderId = Guid.NewGuid(), CurrentUserId = userId };
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
            
            var command = new ConfirmDeliverySuccessCommand { OrderId = Guid.NewGuid(), CurrentUserId = userId };
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
            
            var command = new ConfirmDeliverySuccessCommand { OrderId = Guid.NewGuid(), CurrentUserId = userId };
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
            var order = new Order { Id = Guid.NewGuid(), ShipperId = Guid.NewGuid() }; // Another shipper
            
            SetupUserRepo(user);
            SetupShipperRepo(shipper);
            SetupOrderRepo(order);
            
            var command = new ConfirmDeliverySuccessCommand { OrderId = order.Id, CurrentUserId = userId };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(403);
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
            
            var command = new ConfirmDeliverySuccessCommand { OrderId = order.Id, CurrentUserId = userId };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(400);
            result.Message.Should().Contain("Invalid order status for completing delivery");
        }

        // ── UTC07 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_ValidRequest_Returns200AndCalculatesLoyalty()
        {
            var userId = Guid.NewGuid();
            var userProfileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = userProfileId, Role = UserRole.Shipper, FullName = "Shipper" } };
            var shipper = new ShipperProfile { Id = Guid.NewGuid(), UserProfileId = userProfileId, IsOnline = true, UserProfile = user.Profile };
            
            var customerUserId = Guid.NewGuid();
            var order = new Order 
            { 
                Id = Guid.NewGuid(), 
                ShipperId = shipper.Id, 
                Status = OrderStatus.Shipping, 
                UserAccountId = customerUserId,
                TotalAmount = 500000, // For 500 points
                Items = new List<OrderItem> 
                { 
                    new OrderItem 
                    { 
                        Product = new Product 
                        { 
                            Restaurant = new RestaurantProfile 
                            { 
                                Latitude = 10.0, Longitude = 106.0, 
                                Owner = new UserProfile { UserAccountId = Guid.NewGuid() } 
                            } 
                        } 
                    }
                }
            };
            
            SetupUserRepo(user);
            SetupShipperRepo(shipper);
            SetupOrderRepo(order);
            
            _loyaltyRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<LoyaltyPoint, bool>>>(),
                null, null, 0, 10, false))
                .ReturnsAsync(new List<LoyaltyPoint>().AsReadOnly());
                
            _tierConfigRepoMock.Setup(r => r.GetAllAsync())
                .ReturnsAsync(new List<MemberTierConfig>());
                
            _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
            
            var command = new ConfirmDeliverySuccessCommand { OrderId = order.Id, CurrentUserId = userId, Latitude = 10.0, Longitude = 106.0 };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Contain("Order delivery successfully");
            order.Status.Should().Be(OrderStatus.Delivered);
            
            _orderRepoMock.Verify(r => r.Update(order), Times.Once);
            _notificationRepoMock.Verify(r => r.Add(It.IsAny<Notification>()), Times.AtLeastOnce);
            _paymentMock.Verify(p => p.SettleOrderOnDeliveryAsync(order, shipper), Times.Once);
        }

        // ── UTC08 ─────────────────────────────────────────────────────────────
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
                
            var command = new ConfirmDeliverySuccessCommand { OrderId = Guid.NewGuid(), CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Contain("An error occurred");
        }
    }
}
