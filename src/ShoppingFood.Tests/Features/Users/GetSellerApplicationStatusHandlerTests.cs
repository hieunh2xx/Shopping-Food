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
using ShoppingFood.Application.Features.Users.Queries;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.User;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Users
{
    public class GetSellerApplicationStatusHandlerTests
    {
        private readonly Mock<ISellerApplicationRepository> _sellerAppRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly GetSellerApplicationStatusHandler _handler;

        public GetSellerApplicationStatusHandlerTests()
        {
            _sellerAppRepoMock = new Mock<ISellerApplicationRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _mapperMock = new Mock<IMapper>();

            _handler = new GetSellerApplicationStatusHandler(
                _sellerAppRepoMock.Object,
                _userRepoMock.Object,
                _mapperMock.Object
            );
        }

        [Fact]
        public async Task Handle_NullUserId_Returns401()
        {
            var query = new GetSellerApplicationStatusQuery { CurrentUserId = null };
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(401);
            result.Message.Should().Be("Unauthorized.");
        }

        [Fact]
        public async Task Handle_UserNotFound_Returns404()
        {
            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User>());

            var query = new GetSellerApplicationStatusQuery { CurrentUserId = Guid.NewGuid() };
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(404);
            result.Message.Should().Be("User profile not found");
        }

        [Fact]
        public async Task Handle_ProfileNotFound_Returns404()
        {
            var userId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = null }; // Missing profile

            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { user });

            var query = new GetSellerApplicationStatusQuery { CurrentUserId = userId };
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(404);
            result.Message.Should().Be("User profile not found");
        }

        [Fact]
        public async Task Handle_NoApplication_Returns200WithNullData()
        {
            var userId = Guid.NewGuid();
            var profileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = profileId } };

            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { user });

            _sellerAppRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<SellerApplication, bool>>>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IOrderedQueryable<SellerApplication>>?>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IIncludableQueryable<SellerApplication, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<SellerApplication>());

            var query = new GetSellerApplicationStatusQuery { CurrentUserId = userId };
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("No seller application found for this user.");
            result.Data.Should().BeNull();
        }

        [Fact]
        public async Task Handle_Success_ReturnsStatusDto()
        {
            var userId = Guid.NewGuid();
            var profileId = Guid.NewGuid();
            var user = new User { Id = userId, Profile = new UserProfile { Id = profileId } };

            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { user });

            var app = new SellerApplication { Id = Guid.NewGuid(), UserProfileId = profileId };
            _sellerAppRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<SellerApplication, bool>>>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IOrderedQueryable<SellerApplication>>?>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IIncludableQueryable<SellerApplication, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<SellerApplication> { app });

            var dto = new SellerApplicationStatusDto { Id = app.Id, Status = "Pending" };
            _mapperMock.Setup(m => m.Map<SellerApplicationStatusDto>(app)).Returns(dto);

            var query = new GetSellerApplicationStatusQuery { CurrentUserId = userId };
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Seller application status retrieved successfully");
            result.Data.Should().Be(dto);
        }
    }
}
