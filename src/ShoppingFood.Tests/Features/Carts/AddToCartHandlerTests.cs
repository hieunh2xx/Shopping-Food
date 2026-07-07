using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Moq;
using ShoppingFood.Application.Features.Carts.Commands;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Cart;
using ShoppingFood.Repository.Interfaces;
using ShoppingFood.Application.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Carts
{
    public class AddToCartHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ShoppingFoodContext _dbContext;
        private readonly Mock<ICartRepository> _cartRepositoryMock;
        private readonly Mock<ICartItemRepository> _cartItemRepositoryMock;
        private readonly Mock<IProductRepository> _productRepositoryMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<IFlashSalePricingService> _flashSalePricingServiceMock;
        private readonly AddToCartHandler _handler;

        public AddToCartHandlerTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseSqlite(_connection)
                .Options;

            _dbContext = new ShoppingFoodContext(options);
            _dbContext.Database.EnsureCreated();

            _cartRepositoryMock = new Mock<ICartRepository>();
            _cartItemRepositoryMock = new Mock<ICartItemRepository>();
            _productRepositoryMock = new Mock<IProductRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _flashSalePricingServiceMock = new Mock<IFlashSalePricingService>();

            _handler = new AddToCartHandler(
                _cartRepositoryMock.Object,
                _cartItemRepositoryMock.Object,
                _productRepositoryMock.Object,
                _unitOfWorkMock.Object,
                _mapperMock.Object,
                _dbContext,
                _httpContextAccessorMock.Object,
                _flashSalePricingServiceMock.Object
            );
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Close();
        }

        [Fact]
        public async Task Handle_ProductNotFound_ReturnsNotFound()
        {
            // Arrange
            var productId = Guid.NewGuid();
            _productRepositoryMock
                .Setup(r => r.GetByIdAsync(productId))
                .ReturnsAsync((Product?)null);

            var command = new AddToCartCommand { ProductId = productId, Quantity = 1 };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(404);
            result.Message.Should().Be("Product not found or unavailable.");
        }

        [Fact]
        public async Task Handle_ProductOutOfStock_ReturnsBadRequest()
        {
            // Arrange
            var productId = Guid.NewGuid();
            var product = new Product
            {
                Id = productId,
                Status = ProductStatus.Approved,
                IsHidden = false,
                StockStatus = StockStatus.OutOfStock
            };
            _productRepositoryMock
                .Setup(r => r.GetByIdAsync(productId))
                .ReturnsAsync(product);

            var command = new AddToCartCommand { ProductId = productId, Quantity = 1 };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(400);
            result.Message.Should().Be("Product is out of stock.");
        }

        [Fact]
        public async Task Handle_ValidNewCartItem_AddsSuccessfully()
        {
            // Arrange
            var productId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var product = new Product
            {
                Id = productId,
                Status = ProductStatus.Approved,
                IsHidden = false,
                StockStatus = StockStatus.InStock,
                Price = 50000
            };

            _productRepositoryMock
                .Setup(r => r.GetByIdAsync(productId))
                .ReturnsAsync(product);

            // Mock GetOrCreateCartAsync behavior (cart not exists initially)
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

            // Mock GetCartDtoAsync behavior (called at the end with disableTracking: true)
            _cartRepositoryMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Cart, bool>>>(),
                    null,
                    It.IsAny<Func<IQueryable<Cart>, IIncludableQueryable<Cart, object>>>(),
                    0,
                    10,
                    true
                ))
                .ReturnsAsync(new List<Cart> { new Cart { Id = Guid.NewGuid() } }.AsReadOnly());

            // Mock GetCartItemAsync (no item exists, called with disableTracking: false)
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

            var cartDto = new CartDto { Id = Guid.NewGuid() };
            _mapperMock.Setup(m => m.Map<CartDto>(It.IsAny<Cart>())).Returns(cartDto);

            var command = new AddToCartCommand
            {
                ProductId = productId,
                Quantity = 2,
                CurrentUserId = userId
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(200);
            result.Message.Should().Be("Added item to cart successfully");
            _cartItemRepositoryMock.Verify(r => r.Add(It.IsAny<CartItem>()), Times.Once);
        }
    }
}
