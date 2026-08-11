using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Moq;
using ShoppingFood.Application.Features.Orders.Commands;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using ShoppingFood.Application.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Orders
{
    public class CheckoutHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ShoppingFoodContext _dbContext;
        private readonly Mock<ICartRepository> _cartRepoMock;
        private readonly Mock<ICartItemRepository> _cartItemRepoMock;
        private readonly Mock<IOrderRepository> _orderRepoMock;
        private readonly Mock<IRestaurantProfileRepository> _restaurantRepoMock;
        private readonly Mock<IOtpRecordRepository> _otpRepoMock;
        private readonly Mock<IGuestUserRepository> _guestUserRepoMock;
        private readonly Mock<IDiscountRepository> _discountRepoMock;
        private readonly Mock<ICustomerDiscountRepository> _customerDiscountRepoMock;
        private readonly Mock<ILoyaltyPointRepository> _loyaltyRepoMock;
        private readonly Mock<IFlashSaleProductRepository> _flashSaleProductRepoMock;
        private readonly Mock<IPaymentSettlementService> _paymentMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IHttpContextAccessor> _httpContextMock;
        private readonly Mock<IPlatformFinanceConfigRepository> _configRepoMock;
        private readonly Mock<IFlashSalePricingService> _flashSalePricingMock;
        private readonly Mock<INotificationRepository> _notificationRepoMock;
        
        private readonly CheckoutHandler _handler;

        public CheckoutHandlerTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseSqlite(_connection)
                .Options;

            _dbContext = new ShoppingFoodContext(options);
            // Bypass EnsureCreated to avoid nvarchar(max) errors, manually create required table
            _dbContext.Database.ExecuteSqlRaw("CREATE TABLE SystemConfigs (\"Key\" TEXT, \"Value\" TEXT, Description TEXT, Id TEXT, CreatedAt TEXT, UpdatedAt TEXT, IsDeleted INTEGER)");
            _dbContext.Database.ExecuteSqlRaw("CREATE TABLE SYSTEM_CONFIG (\"Key\" TEXT, \"Value\" TEXT, Description TEXT, Id TEXT, CreatedAt TEXT, UpdatedAt TEXT, IsDeleted INTEGER)");

            _cartRepoMock = new Mock<ICartRepository>();
            _cartItemRepoMock = new Mock<ICartItemRepository>();
            _orderRepoMock = new Mock<IOrderRepository>();
            _restaurantRepoMock = new Mock<IRestaurantProfileRepository>();
            _otpRepoMock = new Mock<IOtpRecordRepository>();
            _guestUserRepoMock = new Mock<IGuestUserRepository>();
            _discountRepoMock = new Mock<IDiscountRepository>();
            _customerDiscountRepoMock = new Mock<ICustomerDiscountRepository>();
            _loyaltyRepoMock = new Mock<ILoyaltyPointRepository>();
            _flashSaleProductRepoMock = new Mock<IFlashSaleProductRepository>();
            _paymentMock = new Mock<IPaymentSettlementService>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _httpContextMock = new Mock<IHttpContextAccessor>();
            _configRepoMock = new Mock<IPlatformFinanceConfigRepository>();
            _flashSalePricingMock = new Mock<IFlashSalePricingService>();
            _notificationRepoMock = new Mock<INotificationRepository>();
            var cartMergeMock = new Mock<ICartMergeService>();

            _handler = new CheckoutHandler(
                _cartRepoMock.Object,
                _cartItemRepoMock.Object,
                _orderRepoMock.Object,
                _restaurantRepoMock.Object,
                _otpRepoMock.Object,
                _guestUserRepoMock.Object,
                _discountRepoMock.Object,
                _customerDiscountRepoMock.Object,
                _loyaltyRepoMock.Object,
                _flashSaleProductRepoMock.Object,
                _paymentMock.Object,
                _unitOfWorkMock.Object,
                _dbContext,
                _httpContextMock.Object,
                _configRepoMock.Object,
                _flashSalePricingMock.Object,
                _notificationRepoMock.Object,
                cartMergeMock.Object
            );
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Close();
        }

        // ── UTC01 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_Unauthorized_Returns401()
        {
            var command = new CheckoutCommand { CurrentUserId = null, GuestUserId = null };
            var result = await _handler.Handle(command, CancellationToken.None);
            result.Code.Should().Be(401);
            result.Message.Should().Be("Unauthorized.");
        }

        // ── UTC02 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_Guest_LockedOTP_Returns403()
        {
            _otpRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Expression<Func<OtpRecord, bool>>>())).ReturnsAsync(true);
            
            var command = new CheckoutCommand { CurrentUserId = null, GuestUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(403);
            result.Message.Should().Contain("locked due to too many failed OTP attempts");
        }

        // ── UTC07 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_Member_EmptyCart_Returns400()
        {
            _cartRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<Cart, bool>>>(),
                It.IsAny<Func<IQueryable<Cart>, IOrderedQueryable<Cart>>>(),
                It.IsAny<Func<IQueryable<Cart>, IIncludableQueryable<Cart, object>>>(),
                0, 10, false))
                .ReturnsAsync(new List<Cart>().AsReadOnly());
                
            var command = new CheckoutCommand { CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Your cart is empty.");
        }

        // ── UTC08 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_ProductUnavailable_Returns400()
        {
            var product = new Product { Id = Guid.NewGuid(), ItemName = "Pizza", Status = ProductStatus.Pending }; // Not approved
            var cart = new Cart { Id = Guid.NewGuid(), Items = new List<CartItem> { new CartItem { Product = product } } };
            
            _cartRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<Cart, bool>>>(),
                It.IsAny<Func<IQueryable<Cart>, IOrderedQueryable<Cart>>>(), It.IsAny<Func<IQueryable<Cart>, IIncludableQueryable<Cart, object>>>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<Cart> { cart }.AsReadOnly());
                
            var command = new CheckoutCommand { CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Contain("not available for purchase");
        }

        // ── UTC12 ─────────────────────────────────────────────────────────────
        [Fact]
        public async Task Handle_ValidCODOrder_Returns200AndPending()
        {
            var customerId = Guid.NewGuid();
            var restaurantId = Guid.NewGuid();
            var ownerUserId = Guid.NewGuid();
            var restaurant = new RestaurantProfile 
            { 
                Id = restaurantId, ShippingFee = 15000, DeliveryType = DeliveryType.PlatformDelivery,
                Latitude = 10.0, Longitude = 106.0, Owner = new UserProfile { UserAccountId = ownerUserId }
            };
            var product = new Product { Id = Guid.NewGuid(), RestaurantId = restaurantId, Restaurant = restaurant, ItemName = "Burger", Status = ProductStatus.Approved, StockStatus = StockStatus.InStock };
            var cart = new Cart 
            { 
                Id = Guid.NewGuid(), 
                Items = new List<CartItem> { new CartItem { Product = product, PriceAtAdded = 50000, Quantity = 2 } } 
            };
            
            _cartRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<Cart, bool>>>(),
                It.IsAny<Func<IQueryable<Cart>, IOrderedQueryable<Cart>>>(), It.IsAny<Func<IQueryable<Cart>, IIncludableQueryable<Cart, object>>>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<Cart> { cart }.AsReadOnly());
                
            _restaurantRepoMock.Setup(r => r.GetByIdAsync(restaurantId)).ReturnsAsync(restaurant);
            
            _flashSaleProductRepoMock.Setup(r => r.GetAsync(It.IsAny<Expression<Func<FlashSaleProduct, bool>>>(), It.IsAny<Func<IQueryable<FlashSaleProduct>, IOrderedQueryable<FlashSaleProduct>>>(), It.IsAny<Func<IQueryable<FlashSaleProduct>, IIncludableQueryable<FlashSaleProduct, object>>>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<FlashSaleProduct>().AsReadOnly());
            
            _loyaltyRepoMock.Setup(r => r.GetAsync(It.IsAny<Expression<Func<LoyaltyPoint, bool>>>(), It.IsAny<Func<IQueryable<LoyaltyPoint>, IOrderedQueryable<LoyaltyPoint>>>(), It.IsAny<Func<IQueryable<LoyaltyPoint>, IIncludableQueryable<LoyaltyPoint, object>>>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<LoyaltyPoint>().AsReadOnly());

            _configRepoMock.Setup(r => r.GetAllAsync())
                .ReturnsAsync(new List<PlatformFinanceConfig>());
            
            // Payment settlement returns no error
            _paymentMock.Setup(p => p.ProcessCheckoutPaymentAsync(It.IsAny<Order>(), customerId, null, null, null))
                .ReturnsAsync((string?)null);

            var command = new CheckoutCommand { CurrentUserId = customerId, PaymentMethod = PaymentMethod.COD, DeliveryLatitude = 10.0, DeliveryLongitude = 106.0 };
            
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200, $"failed with message: {result.Message}");
            result.Message.Should().Be("Checkout successful.");
            
            _orderRepoMock.Verify(r => r.Add(It.IsAny<Order>()), Times.Once);
            _cartItemRepoMock.Verify(r => r.Delete(It.IsAny<CartItem>()), Times.Once); // Cart cleared
        }
    }
}
