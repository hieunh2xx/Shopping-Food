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
    /// Unit tests for AcceptOrderHandler.
    /// Step 1 in order flow: Seller accepts a Pending order → Status becomes Confirmed.
    /// </summary>
    public class SellerAcceptOrderTests
    {
        private readonly Mock<IOrderRepository> _orderRepoMock;
        private readonly Mock<IRestaurantProfileRepository> _restaurantRepoMock;
        private readonly Mock<INotificationRepository> _notificationRepoMock;
        private readonly Mock<INotificationPushService> _notificationPushMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly AcceptOrderHandler _handler;

        public SellerAcceptOrderTests()
        {
            _orderRepoMock = new Mock<IOrderRepository>();
            _restaurantRepoMock = new Mock<IRestaurantProfileRepository>();
            _notificationRepoMock = new Mock<INotificationRepository>();
            _notificationPushMock = new Mock<INotificationPushService>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();

            _handler = new AcceptOrderHandler(
                _orderRepoMock.Object,
                _restaurantRepoMock.Object,
                _notificationRepoMock.Object,
                _notificationPushMock.Object,
                _unitOfWorkMock.Object
            );
        }

        // ── UTC01 ─────────────────────────────────────────────────────────────
        // Abnormal: CurrentUserId is null → 401 Unauthorized
        [Fact]
        public async Task Handle_NoCurrentUserId_Returns401()
        {
            // Arrange
            var command = new AcceptOrderCommand { OrderId = Guid.NewGuid(), CurrentUserId = null };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(401);
            result.Message.Should().Be("Unauthorized.");
        }

        // ── UTC02 ─────────────────────────────────────────────────────────────
        // Abnormal: Order not found → 404
        [Fact]
        public async Task Handle_OrderNotFound_Returns404()
        {
            // Arrange
            _orderRepoMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Order, bool>>>(),
                    It.IsAny<Func<IQueryable<Order>, IOrderedQueryable<Order>>>(),
                    It.IsAny<Func<IQueryable<Order>, IIncludableQueryable<Order, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<Order>().AsReadOnly());

            var command = new AcceptOrderCommand { OrderId = Guid.NewGuid(), CurrentUserId = Guid.NewGuid() };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(404);
            result.Message.Should().Be("Order not found.");
        }

        // ── UTC03 ─────────────────────────────────────────────────────────────
        // Abnormal: Order status is not Pending → 400
        [Fact]
        public async Task Handle_OrderNotPending_Returns400()
        {
            // Arrange
            var order = new Order { Id = Guid.NewGuid(), Status = OrderStatus.Confirmed };

            _orderRepoMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Order, bool>>>(),
                    It.IsAny<Func<IQueryable<Order>, IOrderedQueryable<Order>>>(),
                    It.IsAny<Func<IQueryable<Order>, IIncludableQueryable<Order, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<Order> { order }.AsReadOnly());

            var command = new AcceptOrderCommand { OrderId = order.Id, CurrentUserId = Guid.NewGuid() };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(400);
            result.Message.Should().Be("Only pending orders can be accepted.");
        }

        // ── UTC04 ─────────────────────────────────────────────────────────────
        // Abnormal: Seller has no restaurant → 403
        [Fact]
        public async Task Handle_SellerHasNoRestaurant_Returns403()
        {
            // Arrange
            var order = new Order
            {
                Id = Guid.NewGuid(),
                Status = OrderStatus.Pending,
                Items = new List<OrderItem>()
            };

            _orderRepoMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Order, bool>>>(),
                    It.IsAny<Func<IQueryable<Order>, IOrderedQueryable<Order>>>(),
                    It.IsAny<Func<IQueryable<Order>, IIncludableQueryable<Order, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<Order> { order }.AsReadOnly());

            _restaurantRepoMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<RestaurantProfile, bool>>>(),
                    It.IsAny<Func<IQueryable<RestaurantProfile>, IOrderedQueryable<RestaurantProfile>>>(),
                    It.IsAny<Func<IQueryable<RestaurantProfile>, IIncludableQueryable<RestaurantProfile, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<RestaurantProfile>().AsReadOnly());

            var command = new AcceptOrderCommand { OrderId = order.Id, CurrentUserId = Guid.NewGuid() };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(403);
            result.Message.Should().Be("You do not own any restaurants on the system.");
        }

        // ── UTC05 ─────────────────────────────────────────────────────────────
        // Abnormal: Order items not from seller's restaurant → 403
        [Fact]
        public async Task Handle_OrderNotFromSellerRestaurant_Returns403()
        {
            // Arrange
            var restaurantId = Guid.NewGuid();
            var otherRestaurantId = Guid.NewGuid();

            var product = new Product { Id = Guid.NewGuid(), RestaurantId = otherRestaurantId };
            var order = new Order
            {
                Id = Guid.NewGuid(),
                Status = OrderStatus.Pending,
                Items = new List<OrderItem>
                {
                    new OrderItem { Id = Guid.NewGuid(), Product = product }
                }
            };

            var restaurant = new RestaurantProfile { Id = restaurantId };

            _orderRepoMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Order, bool>>>(),
                    It.IsAny<Func<IQueryable<Order>, IOrderedQueryable<Order>>>(),
                    It.IsAny<Func<IQueryable<Order>, IIncludableQueryable<Order, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<Order> { order }.AsReadOnly());

            _restaurantRepoMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<RestaurantProfile, bool>>>(),
                    It.IsAny<Func<IQueryable<RestaurantProfile>, IOrderedQueryable<RestaurantProfile>>>(),
                    It.IsAny<Func<IQueryable<RestaurantProfile>, IIncludableQueryable<RestaurantProfile, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<RestaurantProfile> { restaurant }.AsReadOnly());

            var command = new AcceptOrderCommand { OrderId = order.Id, CurrentUserId = Guid.NewGuid() };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(403);
            result.Message.Should().Be("This order contains dishes that are not from your restaurant.");
        }

        // ── UTC06 ─────────────────────────────────────────────────────────────
        // Normal: Valid seller accepts pending order → 200, status becomes Confirmed
        [Fact]
        public async Task Handle_ValidSellerAcceptsPendingOrder_Returns200AndConfirmed()
        {
            // Arrange
            var restaurantId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var sellerId = Guid.NewGuid();

            var product = new Product { Id = Guid.NewGuid(), RestaurantId = restaurantId };
            var order = new Order
            {
                Id = Guid.NewGuid(),
                Status = OrderStatus.Pending,
                UserAccountId = customerId,
                Items = new List<OrderItem>
                {
                    new OrderItem { Id = Guid.NewGuid(), Product = product }
                }
            };

            var restaurant = new RestaurantProfile { Id = restaurantId };

            _orderRepoMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Order, bool>>>(),
                    It.IsAny<Func<IQueryable<Order>, IOrderedQueryable<Order>>>(),
                    It.IsAny<Func<IQueryable<Order>, IIncludableQueryable<Order, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<Order> { order }.AsReadOnly());

            _restaurantRepoMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<RestaurantProfile, bool>>>(),
                    It.IsAny<Func<IQueryable<RestaurantProfile>, IOrderedQueryable<RestaurantProfile>>>(),
                    It.IsAny<Func<IQueryable<RestaurantProfile>, IIncludableQueryable<RestaurantProfile, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<RestaurantProfile> { restaurant }.AsReadOnly());

            _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var command = new AcceptOrderCommand { OrderId = order.Id, CurrentUserId = sellerId };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(200);
            result.Message.Should().Be("Accept order successfully");
            order.Status.Should().Be(OrderStatus.Confirmed);
            _orderRepoMock.Verify(r => r.Update(order), Times.Once);
        }

        // ── UTC07 ─────────────────────────────────────────────────────────────
        // Abnormal: Dependency throws Exception → 400
        [Fact]
        public async Task Handle_DependencyThrowsException_Returns400()
        {
            // Arrange
            _orderRepoMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Order, bool>>>(),
                    It.IsAny<Func<IQueryable<Order>, IOrderedQueryable<Order>>>(),
                    It.IsAny<Func<IQueryable<Order>, IIncludableQueryable<Order, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ThrowsAsync(new Exception("DB connection failed"));

            _unitOfWorkMock.Setup(u => u.LogErrorAsync(It.IsAny<string>(), It.IsAny<Exception>()))
                .Returns(Task.CompletedTask);

            var command = new AcceptOrderCommand { OrderId = Guid.NewGuid(), CurrentUserId = Guid.NewGuid() };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(400);
            result.Message.Should().Contain("An error occurred");
        }
    }
}
