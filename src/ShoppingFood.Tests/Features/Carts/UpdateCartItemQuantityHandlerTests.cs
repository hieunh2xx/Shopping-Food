using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore.Query;
using Moq;
using ShoppingFood.Application.Features.Carts.Commands;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Cart;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Carts
{
    public class UpdateCartItemQuantityHandlerTests
    {
        private readonly Mock<ICartRepository> _cartRepositoryMock;
        private readonly Mock<ICartItemRepository> _cartItemRepositoryMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly UpdateCartItemQuantityHandler _handler;

        public UpdateCartItemQuantityHandlerTests()
        {
            _cartRepositoryMock = new Mock<ICartRepository>();
            _cartItemRepositoryMock = new Mock<ICartItemRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();

            _handler = new UpdateCartItemQuantityHandler(
                _cartRepositoryMock.Object,
                _cartItemRepositoryMock.Object,
                _unitOfWorkMock.Object,
                _mapperMock.Object
            );
        }

        [Fact]
        public async Task Handle_Unauthorized_NeitherUserNorGuestProvided_Returns401()
        {
            // Arrange
            var command = new UpdateCartItemQuantityCommand
            {
                ProductId = Guid.NewGuid(),
                Quantity = 5,
                CurrentUserId = null,
                GuestUserId = null
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(401);
            result.Message.Should().Be("Unauthorized. Neither logged-in user nor guest ID was provided.");
        }

        [Fact]
        public async Task Handle_CartNotFound_Returns404()
        {
            // Arrange
            var command = new UpdateCartItemQuantityCommand
            {
                ProductId = Guid.NewGuid(),
                Quantity = 5,
                CurrentUserId = Guid.NewGuid()
            };

            _cartRepositoryMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Cart, bool>>>(),
                    null,
                    null,
                    0,
                    10,
                    false
                ))
                .ReturnsAsync(new List<Cart>().AsReadOnly());

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(404);
            result.Message.Should().Be("Cart not found.");
        }

        [Fact]
        public async Task Handle_ItemNotFoundInCart_Returns404()
        {
            // Arrange
            var cartId = Guid.NewGuid();
            var command = new UpdateCartItemQuantityCommand
            {
                ProductId = Guid.NewGuid(),
                Quantity = 5,
                CurrentUserId = Guid.NewGuid()
            };

            _cartRepositoryMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Cart, bool>>>(),
                    null,
                    null,
                    0,
                    10,
                    false
                ))
                .ReturnsAsync(new List<Cart> { new Cart { Id = cartId } }.AsReadOnly());

            _cartItemRepositoryMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<CartItem, bool>>>(),
                    null,
                    null,
                    0,
                    10,
                    false
                ))
                .ReturnsAsync(new List<CartItem>().AsReadOnly());

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(404);
            result.Message.Should().Be("Item not found in cart.");
        }

        [Fact]
        public async Task Handle_QuantityLessThanOrEqualZero_DeletesItem()
        {
            // Arrange
            var cartId = Guid.NewGuid();
            var productId = Guid.NewGuid();
            var command = new UpdateCartItemQuantityCommand
            {
                ProductId = productId,
                Quantity = 0,
                CurrentUserId = Guid.NewGuid()
            };

            var cartItem = new CartItem { Id = Guid.NewGuid(), CartId = cartId, ProductId = productId, Quantity = 2 };

            _cartRepositoryMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Cart, bool>>>(),
                    null,
                    null,
                    0,
                    10,
                    false
                ))
                .ReturnsAsync(new List<Cart> { new Cart { Id = cartId } }.AsReadOnly());

            _cartRepositoryMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Cart, bool>>>(),
                    null,
                    It.IsAny<Func<IQueryable<Cart>, IIncludableQueryable<Cart, object>>>(),
                    0,
                    10,
                    true
                ))
                .ReturnsAsync(new List<Cart> { new Cart { Id = cartId } }.AsReadOnly());

            _cartItemRepositoryMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<CartItem, bool>>>(),
                    null,
                    null,
                    0,
                    10,
                    false
                ))
                .ReturnsAsync(new List<CartItem> { cartItem }.AsReadOnly());

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(200);
            _cartItemRepositoryMock.Verify(r => r.Delete(cartItem), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task Handle_QuantityGreaterThanZero_UpdatesItem()
        {
            // Arrange
            var cartId = Guid.NewGuid();
            var productId = Guid.NewGuid();
            var command = new UpdateCartItemQuantityCommand
            {
                ProductId = productId,
                Quantity = 5,
                CurrentUserId = Guid.NewGuid()
            };

            var cartItem = new CartItem { Id = Guid.NewGuid(), CartId = cartId, ProductId = productId, Quantity = 2 };

            _cartRepositoryMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Cart, bool>>>(),
                    null,
                    null,
                    0,
                    10,
                    false
                ))
                .ReturnsAsync(new List<Cart> { new Cart { Id = cartId } }.AsReadOnly());

            _cartRepositoryMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Cart, bool>>>(),
                    null,
                    It.IsAny<Func<IQueryable<Cart>, IIncludableQueryable<Cart, object>>>(),
                    0,
                    10,
                    true
                ))
                .ReturnsAsync(new List<Cart> { new Cart { Id = cartId } }.AsReadOnly());

            _cartItemRepositoryMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<CartItem, bool>>>(),
                    null,
                    null,
                    0,
                    10,
                    false
                ))
                .ReturnsAsync(new List<CartItem> { cartItem }.AsReadOnly());

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(200);
            cartItem.Quantity.Should().Be(5);
            _cartItemRepositoryMock.Verify(r => r.Update(cartItem), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task Handle_ExceptionThrown_Returns500()
        {
            // Arrange
            var command = new UpdateCartItemQuantityCommand
            {
                ProductId = Guid.NewGuid(),
                Quantity = 5,
                CurrentUserId = Guid.NewGuid()
            };

            _cartRepositoryMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Cart, bool>>>(),
                    null,
                    null,
                    0,
                    10,
                    false
                ))
                .ThrowsAsync(new Exception("Database connection failed."));

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(500);
            result.Message.Should().Contain("Database connection failed.");
            _unitOfWorkMock.Verify(u => u.LogErrorAsync(It.IsAny<string>(), It.IsAny<Exception>()), Times.Once);
        }
    }
}
