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
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.User;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Users
{
    public class GetUserHandlerTests
    {
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<ILoyaltyPointRepository> _lpRepoMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly GetUserHandler _handler;

        public GetUserHandlerTests()
        {
            _userRepoMock = new Mock<IUserRepository>();
            _lpRepoMock = new Mock<ILoyaltyPointRepository>();
            _mapperMock = new Mock<IMapper>();

            _handler = new GetUserHandler(_userRepoMock.Object, _lpRepoMock.Object, _mapperMock.Object);
        }

        [Fact]
        public async Task Handle_NoFilter_ReturnsUsers()
        {
            var userId = Guid.NewGuid();
            var users = new List<User> { new User { Id = userId, UserName = "testuser" } };
            
            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>?>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(users);

            _userRepoMock.Setup(r => r.GetCountAsync(
                It.IsAny<Expression<Func<User, bool>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>()
            )).ReturnsAsync(1);

            var userDtos = new List<UserDto> { new UserDto { Id = userId, UserName = "testuser" } };
            _mapperMock.Setup(m => m.Map<IReadOnlyList<UserDto>>(users)).Returns(userDtos);

            var loyaltyPoints = new List<LoyaltyPoint> 
            { 
                new LoyaltyPoint { UserAccountId = userId, Tier = MemberTier.Silver, TotalEarnedPoints = 100, PointsBalance = 50 } 
            };
            
            _lpRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<LoyaltyPoint, bool>>?>(),
                It.IsAny<Func<IQueryable<LoyaltyPoint>, IOrderedQueryable<LoyaltyPoint>>?>(),
                It.IsAny<Func<IQueryable<LoyaltyPoint>, IIncludableQueryable<LoyaltyPoint, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(loyaltyPoints);

            var query = new GetUserQuery { Skip = 0, Take = 10, Filter = "" };
            var result = await _handler.Handle(query, CancellationToken.None);

            result.Code.Should().Be(200);
            result.Message.Should().Be("Users retrieved successfully");
            result.Total.Should().Be(1);

            var data = result.Data as List<UserDto>;
            data.Should().NotBeNull();
            data.Should().HaveCount(1);
            
            var dto = data!.First();
            dto.Tier.Should().Be(MemberTier.Silver.ToString());
            dto.TotalEarnedPoints.Should().Be(100);
            dto.PointsBalance.Should().Be(50);
        }

        [Fact]
        public async Task Handle_WithFilter_ReturnsFilteredUsers()
        {
            var userId = Guid.NewGuid();
            var users = new List<User> { new User { Id = userId, UserName = "filtereduser" } };
            
            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>?>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(users);

            _userRepoMock.Setup(r => r.GetCountAsync(
                It.IsAny<Expression<Func<User, bool>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>()
            )).ReturnsAsync(1);

            var userDtos = new List<UserDto> { new UserDto { Id = userId, UserName = "filtereduser" } };
            _mapperMock.Setup(m => m.Map<IReadOnlyList<UserDto>>(users)).Returns(userDtos);

            _lpRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<LoyaltyPoint, bool>>?>(),
                It.IsAny<Func<IQueryable<LoyaltyPoint>, IOrderedQueryable<LoyaltyPoint>>?>(),
                It.IsAny<Func<IQueryable<LoyaltyPoint>, IIncludableQueryable<LoyaltyPoint, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<LoyaltyPoint>());

            var query = new GetUserQuery { Skip = 0, Take = 10, Filter = "filter" };
            var result = await _handler.Handle(query, CancellationToken.None);

            result.Code.Should().Be(200);
            result.Message.Should().Be("Users retrieved successfully");
            result.Total.Should().Be(1);

            var data = result.Data as List<UserDto>;
            data.Should().NotBeNull();
            data.Should().HaveCount(1);
        }
    }
}
