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
    /// Unit tests for WaitingShipperOrderHandler.
    /// Step 3: Seller marks Preparing order as WaitingForShipper (or Shipping for SelfDelivery).
    /// </summary>
    public class WaitingShipperOrderTests
    {
        private readonly Mock<IOrderRepository> _orderRepoMock;
        private readonly Mock<IRestaurantProfileRepository> _restaurantRepoMock;
        private readonly Mock<INotificationRepository> _notificationRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly WaitingShipperOrderHandler _handler;

        public WaitingShipperOrderTests()
        {
            _orderRepoMock = new Mock<IOrderRepository>();
            _restaurantRepoMock = new Mock<IRestaurantProfileRepository>();
            _notificationRepoMock = new Mock<INotificationRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();

            _handler = new WaitingShipperOrderHandler(
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

        private Order BuildPreparingOrder(Guid restaurantId)
        {
            var product = new Product { Id = Guid.NewGuid(), RestaurantId = restaurantId };
            return new Order
            {
                Id = Guid.NewGuid(),
                Status = OrderStatus.Preparing,
                UserAccountId = Guid.NewGuid(),
                Items = new List<OrderItem> { new OrderItem { Product = product } }
            };
        }

        // ── UTC01 ─────────────────────────────────────────────────────────────
        // Abnormal: CurrentUserId null → 403
        [Fact]
        public async Task Handle_NoCurrentUserId_Returns403()
        {
            var command = new WaitingShipperOrderCommand { OrderId = Guid.NewGuid(), CurrentUserId = null };
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
            var command = new WaitingShipperOrderCommand { OrderId = Guid.NewGuid(), CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(404);
            result.Message.Should().Be("Order not found");
        }

        // ── UTC03 ─────────────────────────────────────────────────────────────
        // Abnormal: Order status != Preparing → 400
        [Fact]
        public async Task Handle_OrderNotPreparing_Returns400()
        {
            var order = new Order { Id = Guid.NewGuid(), Status = OrderStatus.Confirmed, Items = new List<OrderItem>() };
            SetupOrderRepo(order);
            var command = new WaitingShipperOrderCommand { OrderId = order.Id, CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(400);
            result.Message.Should().Be("Only preparing orders can be updated to waiting for shipper.");
        }

        // ── UTC04 ─────────────────────────────────────────────────────────────
        // Abnormal: Seller has no restaurant → 403
        [Fact]
        public async Task Handle_SellerHasNoRestaurant_Returns403()
        {
            var order = new Order { Id = Guid.NewGuid(), Status = OrderStatus.Preparing, Items = new List<OrderItem>() };
            SetupOrderRepo(order);
            SetupRestaurantRepo(null);
            var command = new WaitingShipperOrderCommand { OrderId = order.Id, CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(403);
            result.Message.Should().Be("You do not own any restaurants on the system.");
        }

        // ── UTC05 ─────────────────────────────────────────────────────────────
        // Abnormal: Order not from seller's restaurant → 403
        [Fact]
        public async Task Handle_OrderNotFromSellerRestaurant_Returns403()
        {
            var restaurantId = Guid.NewGuid();
            var product = new Product { Id = Guid.NewGuid(), RestaurantId = Guid.NewGuid() };
            var order = new Order
            {
                Id = Guid.NewGuid(),
                Status = OrderStatus.Preparing,
                Items = new List<OrderItem> { new OrderItem { Product = product } }
            };
            SetupOrderRepo(order);
            SetupRestaurantRepo(new RestaurantProfile { Id = restaurantId, DeliveryType = DeliveryType.PlatformDelivery });
            var command = new WaitingShipperOrderCommand { OrderId = order.Id, CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(403);
            result.Message.Should().Be("This order contains dishes that are not from your restaurant.");
        }

        // ── UTC06 ─────────────────────────────────────────────────────────────
        // Normal: SelfDelivery restaurant → Status becomes Shipping directly
        [Fact]
        public async Task Handle_SelfDeliveryRestaurant_Returns200AndShipping()
        {
            var restaurantId = Guid.NewGuid();
            var order = BuildPreparingOrder(restaurantId);
            var restaurant = new RestaurantProfile { Id = restaurantId, DeliveryType = DeliveryType.SelfDelivery };

            SetupOrderRepo(order);
            SetupRestaurantRepo(restaurant);
            _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var command = new WaitingShipperOrderCommand { OrderId = order.Id, CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);

            result.Code.Should().Be(200);
            result.Message.Should().Be("Order status updated to Shipping (Self Delivery).");
            order.Status.Should().Be(OrderStatus.Shipping);
        }

        // ── UTC07 ─────────────────────────────────────────────────────────────
        // Normal: Platform delivery → Status becomes WaitingForShipper
        [Fact]
        public async Task Handle_PlatformDeliveryRestaurant_Returns200AndWaitingForShipper()
        {
            var restaurantId = Guid.NewGuid();
            var order = BuildPreparingOrder(restaurantId);
            var restaurant = new RestaurantProfile { Id = restaurantId, DeliveryType = DeliveryType.PlatformDelivery };

            SetupOrderRepo(order);
            SetupRestaurantRepo(restaurant);
            _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var command = new WaitingShipperOrderCommand { OrderId = order.Id, CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);

            result.Code.Should().Be(200);
            result.Message.Should().Be("Order status updated to Waiting for Shipper successfully.");
            order.Status.Should().Be(OrderStatus.WaitingForShipper);
        }

        // ── UTC08 ─────────────────────────────────────────────────────────────
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
                .ThrowsAsync(new Exception("timeout"));

            _unitOfWorkMock.Setup(u => u.LogErrorAsync(It.IsAny<string>(), It.IsAny<Exception>()))
                .Returns(Task.CompletedTask);

            var command = new WaitingShipperOrderCommand { OrderId = Guid.NewGuid(), CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);

            result.Code.Should().Be(400);
            result.Message.Should().Contain("An error occurred");
        }
    }
}
