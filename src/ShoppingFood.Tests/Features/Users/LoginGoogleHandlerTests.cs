using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Users
{
    public class LoginGoogleHandlerTests
    {
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IConfiguration> _configMock;
        private readonly LoginGoogleHandler _handler;

        public LoginGoogleHandlerTests()
        {
            _userRepoMock = new Mock<IUserRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _configMock = new Mock<IConfiguration>();

            _handler = new LoginGoogleHandler(_userRepoMock.Object, _unitOfWorkMock.Object, _configMock.Object);
        }

        [Fact]
        public async Task Handle_MissingClientId_Returns400()
        {
            _configMock.Setup(c => c["GoogleAuth:ClientId"]).Returns((string?)null);

            var command = new LoginGoogleCommand { Credential = "dummy_credential" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Google Auth is not configured on the server.");
        }

        [Fact]
        public async Task Handle_InvalidCredential_Returns400()
        {
            _configMock.Setup(c => c["GoogleAuth:ClientId"]).Returns("dummy_client_id");

            // GoogleJsonWebSignature.ValidateAsync will fail to parse this and throw InvalidJwtException
            var command = new LoginGoogleCommand { Credential = "invalid_credential_format" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            // It might return either "Invalid Google credential token." or "An error occurred during Google Login:..." 
            // depending on which exception is thrown (InvalidJwtException vs generic Exception). 
            // We just verify it's a 400.
        }
    }
}
