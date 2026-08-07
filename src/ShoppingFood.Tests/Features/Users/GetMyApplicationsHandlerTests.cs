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
    public class GetMyApplicationsHandlerTests
    {
        private readonly Mock<ISellerApplicationRepository> _sellerAppRepoMock;
        private readonly Mock<IShipperApplicationRepository> _shipperAppRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly GetMyApplicationsHandler _handler;

        public GetMyApplicationsHandlerTests()
        {
            _sellerAppRepoMock = new Mock<ISellerApplicationRepository>();
            _shipperAppRepoMock = new Mock<IShipperApplicationRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _mapperMock = new Mock<IMapper>();

            _handler = new GetMyApplicationsHandler(
                _sellerAppRepoMock.Object,
                _shipperAppRepoMock.Object,
                _userRepoMock.Object,
                _mapperMock.Object
            );
        }

        [Fact]
        public async Task Handle_NullUserId_Returns401()
        {
            var query = new GetMyApplicationsQuery { CurrentUserId = null };
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(401);
            result.Message.Should().Be("Unauthorized");
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

            var query = new GetMyApplicationsQuery { CurrentUserId = Guid.NewGuid() };
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

            var query = new GetMyApplicationsQuery { CurrentUserId = userId };
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(404);
            result.Message.Should().Be("User profile not found");
        }

        [Fact]
        public async Task Handle_Success_ReturnsMappedApplications()
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

            var sellerApps = new List<SellerApplication> { new SellerApplication { Id = Guid.NewGuid(), UserProfileId = profileId } };
            _sellerAppRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<SellerApplication, bool>>>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IOrderedQueryable<SellerApplication>>?>(),
                It.IsAny<Func<IQueryable<SellerApplication>, IIncludableQueryable<SellerApplication, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(sellerApps);

            var shipperApps = new List<ShipperApplication> { new ShipperApplication { Id = Guid.NewGuid(), UserProfileId = profileId } };
            _shipperAppRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<ShipperApplication, bool>>>(),
                It.IsAny<Func<IQueryable<ShipperApplication>, IOrderedQueryable<ShipperApplication>>?>(),
                It.IsAny<Func<IQueryable<ShipperApplication>, IIncludableQueryable<ShipperApplication, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(shipperApps);

            var sellerDtos = new List<SellerApplicationDto> { new SellerApplicationDto() };
            _mapperMock.Setup(m => m.Map<List<SellerApplicationDto>>(sellerApps)).Returns(sellerDtos);

            var shipperDtos = new List<ShipperApplicationDto> { new ShipperApplicationDto() };
            _mapperMock.Setup(m => m.Map<List<ShipperApplicationDto>>(shipperApps)).Returns(shipperDtos);

            var query = new GetMyApplicationsQuery { CurrentUserId = userId };
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(200);
            
            var data = result.Data as MyApplicationsResponseDto;
            data.Should().NotBeNull();
            data!.SellerApplications.Should().BeEquivalentTo(sellerDtos);
            data.ShipperApplications.Should().BeEquivalentTo(shipperDtos);
        }
    }
}
