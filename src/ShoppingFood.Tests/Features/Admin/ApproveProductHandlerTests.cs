using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Moq;
using ShoppingFood.Application.Features.Admin.Commands;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace ShoppingFood.Tests.Features.Admin
{
    public class ApproveProductHandlerTests : IDisposable
    {
        private readonly Mock<IProductRepository> _mockProductRepo;
        private readonly Mock<IUserRepository> _mockUserRepo;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IMapper> _mockMapper;
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly Mock<INotificationRepository> _mockNotificationRepo;
        private readonly ShoppingFoodContext _dbContext;
        private readonly ApproveProductHandler _handler;

        public ApproveProductHandlerTests()
        {
            _mockProductRepo = new Mock<IProductRepository>();
            _mockUserRepo = new Mock<IUserRepository>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockMapper = new Mock<IMapper>();
            _mockEmailService = new Mock<IEmailService>();
            _mockNotificationRepo = new Mock<INotificationRepository>();

            var options = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .ConfigureWarnings(x => x.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
                .Options;
            _dbContext = new ShoppingFoodContext(options);

            _handler = new ApproveProductHandler(
                _mockProductRepo.Object,
                _mockUserRepo.Object,
                _mockUnitOfWork.Object,
                _mockMapper.Object,
                _mockEmailService.Object,
                _mockNotificationRepo.Object,
                _dbContext
            );
        }

        public void Dispose()
        {
            _dbContext.Database.EnsureDeleted();
            _dbContext.Dispose();
        }

        [Fact]
        public async Task Handle_UnauthorizedUser_Returns401()
        {
            var command = new ApproveProductCommand { CurrentUserId = null };
            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.True(result.Error);
            Assert.Equal(401, result.Code);
            Assert.Equal("User is unauthorized.", result.Message);
        }

        [Fact]
        public async Task Handle_ProductNotFound_Returns404()
        {
            var currentUserId = Guid.NewGuid();
            var productId = Guid.NewGuid();
            var command = new ApproveProductCommand { CurrentUserId = currentUserId, ProductId = productId };

            _mockProductRepo.Setup(x => x.GetAsync(
                It.IsAny<Expression<Func<Product, bool>>>(),
                It.IsAny<Func<IQueryable<Product>, IOrderedQueryable<Product>>?>(),
                It.IsAny<Func<IQueryable<Product>, Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<Product, object>>?>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()
            )).ReturnsAsync(new List<Product>());

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.True(result.Error);
            Assert.Equal(404, result.Code);
            Assert.Contains("was not found", result.Message);
        }

        [Fact]
        public async Task Handle_ApproveProduct_Success()
        {
            var currentUserId = Guid.NewGuid();
            var productId = Guid.NewGuid();
            var command = new ApproveProductCommand 
            { 
                CurrentUserId = currentUserId, 
                ProductId = productId,
                IsApproved = true
            };

            var product = new Product 
            { 
                Id = productId, 
                ItemName = "Test Product",
                Status = ProductStatus.Pending,
                IsHidden = true,
                Restaurant = new RestaurantProfile
                {
                    RestaurantName = "Test Restaurant",
                    Owner = new UserProfile
                    {
                        UserAccountId = Guid.NewGuid(),
                        UserAccount = new User { Email = "owner@test.com" }
                    }
                }
            };

            _mockProductRepo.Setup(x => x.GetAsync(
                It.IsAny<Expression<Func<Product, bool>>>(),
                It.IsAny<Func<IQueryable<Product>, IOrderedQueryable<Product>>?>(),
                It.IsAny<Func<IQueryable<Product>, Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<Product, object>>?>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()
            )).ReturnsAsync(new List<Product> { product });

            _mockMapper.Setup(m => m.Map<ProductDto>(It.IsAny<Product>())).Returns(new ProductDto { Id = productId });

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.False(result.Error);
            Assert.Equal("Product has been approved successfully.", result.Message);
            Assert.Equal(ProductStatus.Approved, product.Status);
            Assert.False(product.IsHidden);
            
            _mockProductRepo.Verify(x => x.Update(product), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
            _mockEmailService.Verify(x => x.SendEmailAsync("owner@test.com", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
            _mockNotificationRepo.Verify(x => x.Add(It.IsAny<Notification>()), Times.Once);
        }

        [Fact]
        public async Task Handle_RejectProduct_Success()
        {
            var currentUserId = Guid.NewGuid();
            var productId = Guid.NewGuid();
            var command = new ApproveProductCommand 
            { 
                CurrentUserId = currentUserId, 
                ProductId = productId,
                IsApproved = false
            };

            var product = new Product 
            { 
                Id = productId, 
                ItemName = "Test Product",
                Status = ProductStatus.Pending,
                Restaurant = new RestaurantProfile
                {
                    RestaurantName = "Test Restaurant",
                    Owner = new UserProfile
                    {
                        UserAccountId = Guid.NewGuid(),
                        UserAccount = new User { Email = "owner@test.com" }
                    }
                }
            };

            _mockProductRepo.Setup(x => x.GetAsync(
                It.IsAny<Expression<Func<Product, bool>>>(),
                It.IsAny<Func<IQueryable<Product>, IOrderedQueryable<Product>>?>(),
                It.IsAny<Func<IQueryable<Product>, Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<Product, object>>?>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()
            )).ReturnsAsync(new List<Product> { product });

            _mockMapper.Setup(m => m.Map<ProductDto>(It.IsAny<Product>())).Returns(new ProductDto { Id = productId });

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.False(result.Error);
            Assert.Equal("Product has been rejected.", result.Message);
            Assert.Equal(ProductStatus.Rejected, product.Status);
            
            _mockProductRepo.Verify(x => x.Update(product), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
            _mockEmailService.Verify(x => x.SendEmailAsync("owner@test.com", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
            _mockNotificationRepo.Verify(x => x.Add(It.IsAny<Notification>()), Times.Once);
        }
    }
}
