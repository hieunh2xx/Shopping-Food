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
using ShoppingFood.Application.Features.Products.Queries;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Products
{
    public class GetProductDetailHandlerTests
    {
        private readonly Mock<IProductRepository> _productRepositoryMock;
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IFlashSaleProductRepository> _flashSaleProductRepositoryMock;
        private readonly GetProductDetailHandler _handler;

        public GetProductDetailHandlerTests()
        {
            _productRepositoryMock = new Mock<IProductRepository>();
            _userRepositoryMock = new Mock<IUserRepository>();
            _mapperMock = new Mock<IMapper>();
            _flashSaleProductRepositoryMock = new Mock<IFlashSaleProductRepository>();

            _handler = new GetProductDetailHandler(
                _productRepositoryMock.Object,
                _userRepositoryMock.Object,
                _mapperMock.Object,
                _flashSaleProductRepositoryMock.Object
            );
        }

        [Fact]
        public async Task Handle_ProductNotFound_Returns404()
        {
            // Arrange
            var query = new GetProductDetailQuery(Guid.NewGuid());
            _productRepositoryMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Product, bool>>>(),
                    null,
                    It.IsAny<Func<IQueryable<Product>, IIncludableQueryable<Product, object>>>(),
                    0,
                    10,
                    true
                ))
                .ReturnsAsync(new List<Product>().AsReadOnly());

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            result.Code.Should().Be(404);
            result.Message.Should().Be("Product was not found.");
        }

        [Fact]
        public async Task Handle_ProductPendingAndUserNotOwner_Returns404()
        {
            // Arrange
            var productId = Guid.NewGuid();
            var query = new GetProductDetailQuery(productId) { CurrentUserId = Guid.NewGuid() };
            var product = new Product
            {
                Id = productId,
                Status = ProductStatus.Pending,
                Restaurant = new RestaurantProfile { OwnerId = Guid.NewGuid() }
            };

            _productRepositoryMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Product, bool>>>(),
                    null,
                    It.IsAny<Func<IQueryable<Product>, IIncludableQueryable<Product, object>>>(),
                    0,
                    10,
                    true
                ))
                .ReturnsAsync(new List<Product> { product }.AsReadOnly());

            _userRepositoryMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<User, bool>>>(),
                    null,
                    It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>>(),
                    0,
                    10,
                    true
                ))
                .ReturnsAsync(new List<User> { new User { Profile = new UserProfile { Id = Guid.NewGuid() } } }.AsReadOnly());

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            result.Code.Should().Be(404);
            result.Message.Should().Be("Product was not found.");
        }

        [Fact]
        public async Task Handle_ProductPendingAndUserIsOwner_Returns200()
        {
            // Arrange
            var productId = Guid.NewGuid();
            var ownerProfileId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var query = new GetProductDetailQuery(productId) { CurrentUserId = userId };
            var product = new Product
            {
                Id = productId,
                Status = ProductStatus.Pending,
                Restaurant = new RestaurantProfile { OwnerId = ownerProfileId }
            };

            _productRepositoryMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Product, bool>>>(),
                    null,
                    It.IsAny<Func<IQueryable<Product>, IIncludableQueryable<Product, object>>>(),
                    0,
                    10,
                    true
                ))
                .ReturnsAsync(new List<Product> { product }.AsReadOnly());

            _userRepositoryMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<User, bool>>>(),
                    null,
                    It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>>(),
                    0,
                    10,
                    true
                ))
                .ReturnsAsync(new List<User> { new User { Id = userId, Profile = new UserProfile { Id = ownerProfileId } } }.AsReadOnly());

            var productDto = new ProductDto { Id = productId, ItemName = "Burger" };
            _mapperMock.Setup(m => m.Map<ProductDto>(product)).Returns(productDto);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            result.Code.Should().Be(200);
            result.Message.Should().Be("Product detail retrieved successfully");
            result.Data.Should().Be(productDto);
        }

        [Fact]
        public async Task Handle_ProductApproved_Returns200()
        {
            // Arrange
            var productId = Guid.NewGuid();
            var query = new GetProductDetailQuery(productId);
            var product = new Product
            {
                Id = productId,
                Status = ProductStatus.Approved
            };

            _productRepositoryMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Product, bool>>>(),
                    null,
                    It.IsAny<Func<IQueryable<Product>, IIncludableQueryable<Product, object>>>(),
                    0,
                    10,
                    true
                ))
                .ReturnsAsync(new List<Product> { product }.AsReadOnly());

            var productDto = new ProductDto { Id = productId, ItemName = "Approved Burger" };
            _mapperMock.Setup(m => m.Map<ProductDto>(product)).Returns(productDto);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            result.Code.Should().Be(200);
            result.Message.Should().Be("Product detail retrieved successfully");
            result.Data.Should().Be(productDto);
        }
    }
}
