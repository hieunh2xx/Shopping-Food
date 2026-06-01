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
using ShoppingFood.Application.Features.Carts.Queries;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Cart;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Carts
{
    public class ClearCartQueryHandlerTests
    {
        private readonly Mock<ICartRepository> _cartRepositoryMock;
        private readonly Mock<ICartItemRepository> _cartItemRepositoryMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly ClearCartQueryHandler _handler;

        public ClearCartQueryHandlerTests()
        {
            _cartRepositoryMock = new Mock<ICartRepository>();
            _cartItemRepositoryMock = new Mock<ICartItemRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();

            _handler = new ClearCartQueryHandler(
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
            var query = new ClearCartQuery
            {
                CurrentUserId = null,
                GuestUserId = null
            };

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            result.Code.Should().Be(401);
            result.Message.Should().Be("Unauthorized. Neither logged-in user nor guest ID was provided.");
        }

        [Fact]
        public async Task Handle_CartNotFound_Returns404()
        {
            // Arrange
            var query = new ClearCartQuery
            {
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
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            result.Code.Should().Be(404);
            result.Message.Should().Be("Cart not found.");
        }

        [Fact]
        public async Task Handle_ValidCart_ClearsAllItemsSuccessfully()
        {
            // Arrange
            var cartId = Guid.NewGuid();
            var query = new ClearCartQuery
            {
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

            var items = new List<CartItem>
            {
                new CartItem { Id = Guid.NewGuid(), CartId = cartId, ProductId = Guid.NewGuid(), Quantity = 1 },
                new CartItem { Id = Guid.NewGuid(), CartId = cartId, ProductId = Guid.NewGuid(), Quantity = 2 }
            };

            _cartItemRepositoryMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<CartItem, bool>>>(),
                    null,
                    null,
                    0,
                    10,
                    false
                ))
                .ReturnsAsync(items.AsReadOnly());

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

            var cartDto = new CartDto { Id = cartId, Items = new List<CartItemDto>() };
            _mapperMock.Setup(m => m.Map<CartDto>(It.IsAny<Cart>())).Returns(cartDto);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            result.Code.Should().Be(200);
            result.Message.Should().Be("Cart cleared successfully.");
            _cartItemRepositoryMock.Verify(r => r.Delete(It.IsAny<CartItem>()), Times.Exactly(2));
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task Handle_ExceptionThrown_Returns400WithErrorMessage()
        {
            // Arrange
            var query = new ClearCartQuery
            {
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
                .ThrowsAsync(new Exception("Clearing cart failed."));

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            result.Code.Should().Be(400);
            result.Message.Should().Contain("Clearing cart failed.");
            _unitOfWorkMock.Verify(u => u.LogErrorAsync(It.IsAny<string>(), It.IsAny<Exception>()), Times.Once);
        }
    }
}
