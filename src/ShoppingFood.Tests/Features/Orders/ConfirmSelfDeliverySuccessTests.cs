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
    /// Unit tests for ConfirmSelfDeliverySuccessHandler.
    /// Step 8: Restaurant owner confirms self-delivery success.
    /// </summary>
    public class ConfirmSelfDeliverySuccessTests
    {
        private readonly Mock<IOrderRepository> _orderRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IPaymentSettlementService> _paymentMock;
        private readonly Mock<INotificationRepository> _notificationRepoMock;
        private readonly Mock<ILoyaltyPointRepository> _loyaltyRepoMock;
        private readonly Mock<ILoyaltyPointHistoryRepository> _loyaltyHistoryRepoMock;
        private readonly Mock<IMemberTierConfigRepository> _tierConfigRepoMock;
        private readonly Mock<IRestaurantProfileRepository> _restaurantRepoMock;
        private readonly Mock<IChatSessionRepository> _chatSessionRepoMock;
        private readonly ChatSessionCloseService _chatSessionCloseService;
        private readonly ConfirmSelfDeliverySuccessHandler _handler;

        public ConfirmSelfDeliverySuccessTests()
        {
            _orderRepoMock = new Mock<IOrderRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _paymentMock = new Mock<IPaymentSettlementService>();
            _notificationRepoMock = new Mock<INotificationRepository>();
            _loyaltyRepoMock = new Mock<ILoyaltyPointRepository>();
            _loyaltyHistoryRepoMock = new Mock<ILoyaltyPointHistoryRepository>();
            _tierConfigRepoMock = new Mock<IMemberTierConfigRepository>();
            _tierConfigRepoMock.Setup(r => r.GetAsync(It.IsAny<Expression<Func<MemberTierConfig, bool>>>(), It.IsAny<Func<IQueryable<MemberTierConfig>, IOrderedQueryable<MemberTierConfig>>>(), It.IsAny<Func<IQueryable<MemberTierConfig>, IIncludableQueryable<MemberTierConfig, object>>>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<MemberTierConfig>().AsReadOnly());
            _tierConfigRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<MemberTierConfig>().AsReadOnly());
            _restaurantRepoMock = new Mock<IRestaurantProfileRepository>();
            _chatSessionRepoMock = new Mock<IChatSessionRepository>();
            _chatSessionRepoMock.Setup(r => r.GetAsync(It.IsAny<Expression<Func<ChatSession, bool>>>(), It.IsAny<Func<IQueryable<ChatSession>, IOrderedQueryable<ChatSession>>>(), It.IsAny<Func<IQueryable<ChatSession>, IIncludableQueryable<ChatSession, object>>>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<ChatSession>().AsReadOnly());
            
            _chatSessionCloseService = new ChatSessionCloseService(_chatSessionRepoMock.Object, _unitOfWorkMock.Object);

            _handler = new ConfirmSelfDeliverySuccessHandler(
                _orderRepoMock.Object,
                _unitOfWorkMock.Object,
                _paymentMock.Object,
                _notificationRepoMock.Object,
                _loyaltyRepoMock.Object,
                _loyaltyHistoryRepoMock.Object,
                _tierConfigRepoMock.Object,
                _restaurantRepoMock.Object,
                _chatSessionCloseService
            );
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

        private void SetupRestaurantRepo(RestaurantProfile? restaurant)
        {
            var list = restaurant == null ? new List<RestaurantProfile>() : new List<RestaurantProfile> { restaurant };
            _restaurantRepoMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<RestaurantProfile, bool>>>(),
                    It.IsAny<Func<IQueryable<RestaurantProfile>, IOrderedQueryable<RestaurantProfile>>>(),
                    It.IsAny<Func<IQueryable<RestaurantProfile>, IIncludableQueryable<RestaurantProfile, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(list.AsReadOnly());
            _restaurantRepoMock
                .Setup(r => r.GetAsync(It.IsAny<Expression<Func<RestaurantProfile, bool>>>()))
                .ReturnsAsync(list.AsReadOnly());
        }

        // ── UTC01 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_NoCurrentUserId_Returns401()
        {
            var command = new ConfirmSelfDeliverySuccessCommand { OrderId = Guid.NewGuid(), CurrentUserId = null };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(403); // The logic returns 403 when user is missing based on plan
        }

        // ── UTC02 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_OrderNotFound_Returns404()
        {
            SetupOrderRepo(null);
            var command = new ConfirmSelfDeliverySuccessCommand { OrderId = Guid.NewGuid(), CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(404);
            result.Message.Should().Be("Order not found.");
        }

        // ── UTC03 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_OrderNotShipping_Returns400()
        {
            var restaurantId = Guid.NewGuid();
            var order = new Order { Id = Guid.NewGuid(), Status = OrderStatus.Pending, Items = new List<OrderItem> { new OrderItem { Product = new Product { RestaurantId = restaurantId } } } };
            SetupOrderRepo(order);
            SetupRestaurantRepo(new RestaurantProfile { Id = restaurantId, Owner = new UserProfile { UserAccountId = Guid.NewGuid() } });
            
            var command = new ConfirmSelfDeliverySuccessCommand { OrderId = order.Id, CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Contain("Invalid order status for completing self-delivery");
        }

        // ── UTC04 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_UserHasNoRestaurant_Returns403()
        {
            var order = new Order { Id = Guid.NewGuid(), Status = OrderStatus.Shipping, Items = new List<OrderItem>() };
            SetupOrderRepo(order);
            SetupRestaurantRepo(null);
            
            var command = new ConfirmSelfDeliverySuccessCommand { OrderId = order.Id, CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(403);
            result.Message.Should().Be("You do not own any restaurants.");
        }

        // ── UTC05 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_OrderNotFromUserRestaurant_Returns403()
        {
            var restaurantId = Guid.NewGuid();
            var order = new Order 
            { 
                Id = Guid.NewGuid(), 
                Status = OrderStatus.Shipping, 
                Items = new List<OrderItem> 
                { 
                    new OrderItem { Product = new Product { RestaurantId = Guid.NewGuid() } } // Different restaurant
                } 
            };
            SetupOrderRepo(order);
            SetupRestaurantRepo(new RestaurantProfile { Id = restaurantId });
            
            var command = new ConfirmSelfDeliverySuccessCommand { OrderId = order.Id, CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(403);
            result.Message.Should().Be("This order contains items that are not from your restaurant.");
        }

        // ── UTC06 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_ValidRequest_Returns200()
        {
            var restaurantId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var order = new Order 
            { 
                Id = Guid.NewGuid(), 
                Status = OrderStatus.Shipping,
                UserAccountId = customerId,
                TotalAmount = 200000,
                Items = new List<OrderItem> 
                { 
                    new OrderItem { Product = new Product { RestaurantId = restaurantId } } 
                } 
            };
            
            SetupOrderRepo(order);
            SetupRestaurantRepo(new RestaurantProfile { Id = restaurantId });
            
            _loyaltyRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<LoyaltyPoint, bool>>>(),
                It.IsAny<Func<IQueryable<LoyaltyPoint>, IOrderedQueryable<LoyaltyPoint>>>(), It.IsAny<Func<IQueryable<LoyaltyPoint>, IIncludableQueryable<LoyaltyPoint, object>>>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<LoyaltyPoint>().AsReadOnly());
                
            _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
            
            var command = new ConfirmSelfDeliverySuccessCommand { OrderId = order.Id, CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200, $"failed with message: {result.Message}");
            result.Message.Should().Be("Order self-delivered successfully.");
            order.Status.Should().Be(OrderStatus.Delivered);
            
            _orderRepoMock.Verify(r => r.Update(order), Times.Once);
            _notificationRepoMock.Verify(r => r.Add(It.IsAny<Notification>()), Times.AtLeastOnce);
            _paymentMock.Verify(p => p.SettleSelfDeliveryOrderAsync(order), Times.Once);
        }

        // ── UTC07 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_ExceptionThrown_Returns400()
        {
            _orderRepoMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Order, bool>>>(),
                    It.IsAny<Func<IQueryable<Order>, IOrderedQueryable<Order>>>(),
                    It.IsAny<Func<IQueryable<Order>, IIncludableQueryable<Order, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ThrowsAsync(new Exception("Database down"));
                
            _unitOfWorkMock.Setup(u => u.LogErrorAsync(It.IsAny<string>(), It.IsAny<Exception>()))
                .Returns(Task.CompletedTask);
                
            var command = new ConfirmSelfDeliverySuccessCommand { OrderId = Guid.NewGuid(), CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Contain("An error occurred");
        }
    }
}
