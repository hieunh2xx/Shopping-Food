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
using ShoppingFood.Application.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Products
{
    public class GetProductsHandlerTests
    {
        private readonly Mock<IProductRepository> _productRepositoryMock;
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IFlashSalePricingService> _flashSalePricingServiceMock;
        private readonly GetProductsHandler _handler;

        public GetProductsHandlerTests()
        {
            _productRepositoryMock = new Mock<IProductRepository>();
            _userRepositoryMock = new Mock<IUserRepository>();
            _mapperMock = new Mock<IMapper>();
            _flashSalePricingServiceMock = new Mock<IFlashSalePricingService>();

            _handler = new GetProductsHandler(
                _productRepositoryMock.Object,
                _userRepositoryMock.Object,
                _mapperMock.Object,
                _flashSalePricingServiceMock.Object
            );
        }

        [Fact]
        public async Task Handle_ReturnsProductsSuccessfully()
        {
            // Arrange
            var query = new GetProductsQuery
            {
                Skip = 0,
                Take = 10
            };

            var mockProducts = new List<Product>
            {
                new Product { Id = Guid.NewGuid(), ItemName = "Burger", Status = ProductStatus.Approved }
            };

            _productRepositoryMock
                .Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<Product, bool>>>(),
                    It.IsAny<Func<IQueryable<Product>, IOrderedQueryable<Product>>>(),
                    It.IsAny<Func<IQueryable<Product>, IIncludableQueryable<Product, object>>>(),
                    It.IsAny<int>(),
                    It.IsAny<int>(),
                    It.IsAny<bool>()
                ))
                .ReturnsAsync(mockProducts.AsReadOnly());

            _productRepositoryMock
                .Setup(r => r.GetCountAsync(
                    It.IsAny<Expression<Func<Product, bool>>>(),
                    It.IsAny<Func<IQueryable<Product>, IIncludableQueryable<Product, object>>>()
                ))
                .ReturnsAsync(1);

            var mockDtos = new List<ProductDto>
            {
                new ProductDto { Id = mockProducts[0].Id, ItemName = "Burger" }
            };

            _mapperMock
                .Setup(m => m.Map<IReadOnlyList<ProductDto>>(It.IsAny<IReadOnlyList<Product>>()))
                .Returns(mockDtos);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            result.Code.Should().Be(200);
            result.Message.Should().Be("Products retrieved successfully");
            result.Total.Should().Be(1);
            result.Data.Should().BeEquivalentTo(mockDtos);
        }
    }
}
