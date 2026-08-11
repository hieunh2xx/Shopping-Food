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
        private readonly Mock<IBuyXGetYPromotionRepository> _promotionRepositoryMock;
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
            // Removed EnsureCreated() to bypass SQLite nvarchar(max) error, we only need _dbContext for transactions.

            _cartRepositoryMock = new Mock<ICartRepository>();
            _cartItemRepositoryMock = new Mock<ICartItemRepository>();
            _productRepositoryMock = new Mock<IProductRepository>();
            _promotionRepositoryMock = new Mock<IBuyXGetYPromotionRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _flashSalePricingServiceMock = new Mock<IFlashSalePricingService>();

            _handler = new AddToCartHandler(
                _cartRepositoryMock.Object,
                _cartItemRepositoryMock.Object,
                _productRepositoryMock.Object,
                _promotionRepositoryMock.Object,
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
                .Setup(r => r.GetAsync(It.IsAny<Expression<Func<Product, bool>>>(), It.IsAny<Func<IQueryable<Product>, IOrderedQueryable<Product>>>(), It.IsAny<Func<IQueryable<Product>, IIncludableQueryable<Product, object>>>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<Product>().AsReadOnly());

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
                .Setup(r => r.GetAsync(It.IsAny<Expression<Func<Product, bool>>>(), It.IsAny<Func<IQueryable<Product>, IOrderedQueryable<Product>>>(), It.IsAny<Func<IQueryable<Product>, IIncludableQueryable<Product, object>>>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<Product> { product }.AsReadOnly());

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
                .Setup(r => r.GetAsync(It.IsAny<Expression<Func<Product, bool>>>(), It.IsAny<Func<IQueryable<Product>, IOrderedQueryable<Product>>>(), It.IsAny<Func<IQueryable<Product>, IIncludableQueryable<Product, object>>>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<Product> { product }.AsReadOnly());

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
                    It.IsAny<Func<IQueryable<CartItem>, IOrderedQueryable<CartItem>>>(),
                    It.IsAny<Func<IQueryable<CartItem>, IIncludableQueryable<CartItem, object>>>(),
                    It.IsAny<int>(),
                    It.IsAny<int>(),
                    It.IsAny<bool>()
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
            result.Code.Should().Be(200, $"failed with message: {result.Message}");
            result.Message.Should().Be("Added item to cart successfully");
            _cartItemRepositoryMock.Verify(r => r.Add(It.IsAny<CartItem>()), Times.Once);
        }

        [Fact]
        public async Task Handle_ConflictRestaurant_ClearIfConflictFalse_Returns409()
        {
            var cartId = Guid.NewGuid();
            var existingRestaurantId = Guid.NewGuid();
            var newRestaurantId = Guid.NewGuid();
            var productId = Guid.NewGuid();

            var newProduct = new Product { Id = productId, RestaurantId = newRestaurantId, Status = ProductStatus.Approved, StockStatus = StockStatus.InStock };
            var existingProduct = new Product { Id = Guid.NewGuid(), RestaurantId = existingRestaurantId };
            
            _productRepositoryMock.Setup(r => r.GetAsync(It.IsAny<Expression<Func<Product, bool>>>(), It.IsAny<Func<IQueryable<Product>, IOrderedQueryable<Product>>>(), It.IsAny<Func<IQueryable<Product>, IIncludableQueryable<Product, object>>>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<Product> { newProduct }.AsReadOnly());
            
            _cartRepositoryMock.Setup(r => r.GetAsync(It.IsAny<Expression<Func<Cart, bool>>>(), It.IsAny<Func<IQueryable<Cart>, IOrderedQueryable<Cart>>>(), It.IsAny<Func<IQueryable<Cart>, IIncludableQueryable<Cart, object>>>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<Cart> { new Cart { Id = cartId } }.AsReadOnly());

            var existingCartItem = new CartItem { Id = Guid.NewGuid(), CartId = cartId, ProductId = existingProduct.Id, Product = existingProduct };

            // Mock ValidateRestaurantConflictAsync (called with include for Product)
            _cartItemRepositoryMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<CartItem, bool>>>(),
                null,
                It.IsAny<Func<IQueryable<CartItem>, IIncludableQueryable<CartItem, object>>>(),
                0, 10, false))
                .ReturnsAsync(new List<CartItem> { existingCartItem }.AsReadOnly());

            var command = new AddToCartCommand { ProductId = productId, Quantity = 1, ClearCartIfConflict = false, CurrentUserId = Guid.NewGuid() };

            var result = await _handler.Handle(command, CancellationToken.None);

            result.Code.Should().Be(409);
            result.Message.Should().Contain("not from the same store");
            _cartItemRepositoryMock.Verify(r => r.Delete(It.IsAny<CartItem>()), Times.Never);
        }

        [Fact]
        public async Task Handle_ConflictRestaurant_ClearIfConflictTrue_Returns200AndClearsCart()
        {
            var cartId = Guid.NewGuid();
            var existingRestaurantId = Guid.NewGuid();
            var newRestaurantId = Guid.NewGuid();
            var productId = Guid.NewGuid();

            var newProduct = new Product { Id = productId, RestaurantId = newRestaurantId, Status = ProductStatus.Approved, StockStatus = StockStatus.InStock };
            var existingProduct = new Product { Id = Guid.NewGuid(), RestaurantId = existingRestaurantId };
            
            _productRepositoryMock.Setup(r => r.GetAsync(It.IsAny<Expression<Func<Product, bool>>>(), It.IsAny<Func<IQueryable<Product>, IOrderedQueryable<Product>>>(), It.IsAny<Func<IQueryable<Product>, IIncludableQueryable<Product, object>>>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<Product> { newProduct }.AsReadOnly());
            
            _cartRepositoryMock.Setup(r => r.GetAsync(It.IsAny<Expression<Func<Cart, bool>>>(), It.IsAny<Func<IQueryable<Cart>, IOrderedQueryable<Cart>>>(), It.IsAny<Func<IQueryable<Cart>, IIncludableQueryable<Cart, object>>>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<Cart> { new Cart { Id = cartId } }.AsReadOnly());

            var existingCartItem = new CartItem { Id = Guid.NewGuid(), CartId = cartId, ProductId = existingProduct.Id, Product = existingProduct };

            // Mock ValidateRestaurantConflictAsync
            _cartItemRepositoryMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<CartItem, bool>>>(),
                null,
                It.IsAny<Func<IQueryable<CartItem>, IIncludableQueryable<CartItem, object>>>(),
                0, 10, false))
                .ReturnsAsync(new List<CartItem> { existingCartItem }.AsReadOnly());

            // Mock GetCartItemAsync (after clear)
            _cartItemRepositoryMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<CartItem, bool>>>(),
                null, null, 0, 10, false))
                .ReturnsAsync(new List<CartItem>().AsReadOnly());
                
            // Mock GetCartDtoAsync
            _cartRepositoryMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<Cart, bool>>>(),
                null, It.IsAny<Func<IQueryable<Cart>, IIncludableQueryable<Cart, object>>>(), 0, 10, true))
                .ReturnsAsync(new List<Cart> { new Cart { Id = cartId } }.AsReadOnly());
                
            _mapperMock.Setup(m => m.Map<CartDto>(It.IsAny<Cart>())).Returns(new CartDto { Id = cartId });

            var command = new AddToCartCommand { ProductId = productId, Quantity = 1, ClearCartIfConflict = true, CurrentUserId = Guid.NewGuid() };

            var result = await _handler.Handle(command, CancellationToken.None);

            result.Code.Should().Be(200, $"failed with message: {result.Message}");
            _cartItemRepositoryMock.Verify(r => r.Delete(existingCartItem), Times.Once);
            _cartItemRepositoryMock.Verify(r => r.Add(It.IsAny<CartItem>()), Times.Once);
        }
    }
}
