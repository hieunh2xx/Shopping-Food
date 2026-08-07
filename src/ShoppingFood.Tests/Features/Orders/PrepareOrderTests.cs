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
    /// Unit tests for PrepareOrderHandler.
    /// Step 2 in order flow: Seller marks a Confirmed order as Preparing.
    /// </summary>
    public class PrepareOrderTests
    {
        private readonly Mock<IOrderRepository> _orderRepoMock;
        private readonly Mock<IRestaurantProfileRepository> _restaurantRepoMock;
        private readonly Mock<INotificationRepository> _notificationRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly PrepareOrderHandler _handler;

        public PrepareOrderTests()
        {
            _orderRepoMock = new Mock<IOrderRepository>();
            _restaurantRepoMock = new Mock<IRestaurantProfileRepository>();
            _notificationRepoMock = new Mock<INotificationRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();

            _handler = new PrepareOrderHandler(
                _orderRepoMock.Object,
                _restaurantRepoMock.Object,
                _notificationRepoMock.Object,
                _unitOfWorkMock.Object
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
        }

        // ── UTC01 ─────────────────────────────────────────────────────────────
        // Abnormal: CurrentUserId is null → 403
        [Fact]
        public async Task Handle_NoCurrentUserId_Returns403()
        {
            var command = new PrepareOrderCommand { OrderId = Guid.NewGuid(), CurrentUserId = null };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(403);
            result.Message.Should().Be("Unauthorized.");
        }

        // ── UTC02 ─────────────────────────────────────────────────────────────
        // Abnormal: Order not found → 404
        [Fact]
        public async Task Handle_OrderNotFound_Returns404()
        {
            SetupOrderRepo(null);
            var command = new PrepareOrderCommand { OrderId = Guid.NewGuid(), CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(404);
            result.Message.Should().Be("Order not found");
        }

        // ── UTC03 ─────────────────────────────────────────────────────────────
        // Abnormal: Order not Confirmed → 400
        [Fact]
        public async Task Handle_OrderNotConfirmed_Returns400()
        {
            var order = new Order { Id = Guid.NewGuid(), Status = OrderStatus.Pending, Items = new List<OrderItem>() };
            SetupOrderRepo(order);
            var command = new PrepareOrderCommand { OrderId = order.Id, CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(400);
            result.Message.Should().Be("Only confirmed orders can be updated to preparing.");
        }

        // ── UTC04 ─────────────────────────────────────────────────────────────
        // Abnormal: Seller has no restaurant → 403
        [Fact]
        public async Task Handle_SellerHasNoRestaurant_Returns403()
        {
            var order = new Order { Id = Guid.NewGuid(), Status = OrderStatus.Confirmed, Items = new List<OrderItem>() };
            SetupOrderRepo(order);
            SetupRestaurantRepo(null);
            var command = new PrepareOrderCommand { OrderId = order.Id, CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(403);
            result.Message.Should().Be("You do not own any restaurants on the system.");
        }

        // ── UTC05 ─────────────────────────────────────────────────────────────
        // Abnormal: Order items not from seller's restaurant → 403
        [Fact]
        public async Task Handle_OrderNotFromSellerRestaurant_Returns403()
        {
            var restaurantId = Guid.NewGuid();
            var product = new Product { Id = Guid.NewGuid(), RestaurantId = Guid.NewGuid() }; // different restaurant
            var order = new Order
            {
                Id = Guid.NewGuid(),
                Status = OrderStatus.Confirmed,
                Items = new List<OrderItem> { new OrderItem { Product = product } }
            };
            SetupOrderRepo(order);
            SetupRestaurantRepo(new RestaurantProfile { Id = restaurantId });
            var command = new PrepareOrderCommand { OrderId = order.Id, CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(403);
            result.Message.Should().Be("This order contains dishes that are not from your restaurant.");
        }

        // ── UTC06 ─────────────────────────────────────────────────────────────
        // Normal: Valid seller prepares confirmed order → 200, status becomes Preparing
        [Fact]
        public async Task Handle_ValidSellerPreparesConfirmedOrder_Returns200AndPreparing()
        {
            var restaurantId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var product = new Product { Id = Guid.NewGuid(), RestaurantId = restaurantId };
            var order = new Order
            {
                Id = Guid.NewGuid(),
                Status = OrderStatus.Confirmed,
                UserAccountId = customerId,
                Items = new List<OrderItem> { new OrderItem { Product = product } }
            };
            SetupOrderRepo(order);
            SetupRestaurantRepo(new RestaurantProfile { Id = restaurantId });
            _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var command = new PrepareOrderCommand { OrderId = order.Id, CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);

            result.Code.Should().Be(200);
            result.Message.Should().Be("Order status updated to Preparing successfully.");
            order.Status.Should().Be(OrderStatus.Preparing);
            _orderRepoMock.Verify(r => r.Update(order), Times.Once);
        }

        // ── UTC07 ─────────────────────────────────────────────────────────────
        // Abnormal: Dependency throws Exception → 400
        [Fact]
        public async Task Handle_DependencyThrowsException_Returns400()
        {
            _orderRepoMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Order, bool>>>(),
                    It.IsAny<Func<IQueryable<Order>, IOrderedQueryable<Order>>>(),
                    It.IsAny<Func<IQueryable<Order>, IIncludableQueryable<Order, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ThrowsAsync(new Exception("DB error"));

            _unitOfWorkMock.Setup(u => u.LogErrorAsync(It.IsAny<string>(), It.IsAny<Exception>()))
                .Returns(Task.CompletedTask);

            var command = new PrepareOrderCommand { OrderId = Guid.NewGuid(), CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);

            result.Code.Should().Be(400);
            result.Message.Should().Contain("An error occurred");
        }
    }
}
