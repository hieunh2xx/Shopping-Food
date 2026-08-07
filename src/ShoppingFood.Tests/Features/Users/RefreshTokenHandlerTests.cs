using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore.Query;
using Microsoft.Extensions.Configuration;
using Moq;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Core.Security;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.User;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Users
{
    public class RefreshTokenHandlerTests
    {
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IConfiguration> _configMock;
        private readonly RefreshTokenHandler _handler;

        public RefreshTokenHandlerTests()
        {
            _userRepoMock = new Mock<IUserRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _configMock = new Mock<IConfiguration>();

            // Setup config for TokenHelper
            _configMock.Setup(c => c["JwtSettings:Secret"]).Returns("SuperSecretShoppingFoodKey1234567890SecretSignatureKeyRequiredForTestingTokens");
            _configMock.Setup(c => c["JwtSettings:Issuer"]).Returns("Issuer");
            _configMock.Setup(c => c["JwtSettings:Audience"]).Returns("Audience");
            _configMock.Setup(c => c.GetSection("JwtSettings")["Secret"]).Returns("SuperSecretShoppingFoodKey1234567890SecretSignatureKeyRequiredForTestingTokens");

            _handler = new RefreshTokenHandler(_userRepoMock.Object, _unitOfWorkMock.Object, _configMock.Object);
        }

        [Fact]
        public async Task Handle_MissingToken_Returns400()
        {
            var command = new RefreshTokenCommand { Token = "", RefreshToken = "refreshtoken" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Invalid client request");
        }

        [Fact]
        public async Task Handle_InvalidTokenFormat_Returns400()
        {
            var command = new RefreshTokenCommand { Token = "invalid.token.format", RefreshToken = "refreshtoken" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Invalid token format");
        }

        [Fact]
        public async Task Handle_UserNotFound_Returns400()
        {
            var token = TokenHelper.GenerateToken("testuser", _configMock.Object["JwtSettings:Secret"]!, "Issuer", "Audience");
            var command = new RefreshTokenCommand { Token = token, RefreshToken = "refreshtoken" };
            
            // Setup repo to return empty
            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User>());

            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Invalid refresh token or token expired");
        }

        [Fact]
        public async Task Handle_ValidTokens_RefreshesSuccessfully()
        {
            var token = TokenHelper.GenerateToken("testuser", _configMock.Object["JwtSettings:Secret"]!, "Issuer", "Audience");
            var oldRefreshToken = "oldrefreshtoken";
            var command = new RefreshTokenCommand { Token = token, RefreshToken = oldRefreshToken };
            
            var user = new User
            {
                Id = Guid.NewGuid(),
                UserName = "testuser",
                RefreshToken = oldRefreshToken,
                RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(1),
                Profile = new UserProfile { FullName = "Test User" }
            };

            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { user });

            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Token refreshed successfully");
            
            var data = result.Data as LoginResponseDto;
            data.Should().NotBeNull();
            data!.Token.Should().NotBeNullOrEmpty();
            data.RefreshToken.Should().NotBeNullOrEmpty();
            data.RefreshToken.Should().NotBe(oldRefreshToken);
            
            user.RefreshToken.Should().Be(data.RefreshToken);
            _userRepoMock.Verify(r => r.Update(user), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task Handle_ExpiredRefreshToken_Returns400()
        {
            var token = TokenHelper.GenerateToken("testuser", _configMock.Object["JwtSettings:Secret"]!, "Issuer", "Audience");
            var oldRefreshToken = "oldrefreshtoken";
            var command = new RefreshTokenCommand { Token = token, RefreshToken = oldRefreshToken };
            
            var user = new User
            {
                Id = Guid.NewGuid(),
                UserName = "testuser",
                RefreshToken = oldRefreshToken,
                RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(-1) // Expired
            };

            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>?>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<bool>()
            )).ReturnsAsync(new List<User> { user });

            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Invalid refresh token or token expired");
        }
    }
}
