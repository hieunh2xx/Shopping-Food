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
    public class LoginMicrosoftHandlerTests
    {
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IConfiguration> _configMock;
        private readonly LoginMicrosoftHandler _handler;

        public LoginMicrosoftHandlerTests()
        {
            _userRepoMock = new Mock<IUserRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _configMock = new Mock<IConfiguration>();

            _handler = new LoginMicrosoftHandler(_userRepoMock.Object, _unitOfWorkMock.Object, _configMock.Object);
        }

        [Fact]
        public async Task Handle_MissingCode_Returns400()
        {
            var command = new LoginMicrosoftCommand { Code = "" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Microsoft authorization code is missing.");
        }

        [Fact]
        public async Task Handle_MissingConfiguration_Returns400()
        {
            _configMock.Setup(c => c["MicrosoftAuth:ClientId"]).Returns((string?)null);
            _configMock.Setup(c => c["MicrosoftAuth:ClientSecret"]).Returns("dummy_secret");

            var command = new LoginMicrosoftCommand { Code = "dummy_code" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Microsoft Auth is not configured on the server.");
        }

        [Fact]
        public async Task Handle_NetworkOrInvalidCode_Returns400()
        {
            _configMock.Setup(c => c["MicrosoftAuth:ClientId"]).Returns("dummy_client_id");
            _configMock.Setup(c => c["MicrosoftAuth:ClientSecret"]).Returns("dummy_secret");

            var command = new LoginMicrosoftCommand { Code = "invalid_code" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            // This will try to hit the real Microsoft API, fail, and return a 400 
            // "Failed to exchange authorization code..." or throw Exception depending on network
            result.Code.Should().Be(400);
            result.Message.Should().Match(m => 
                m.Contains("Failed to exchange authorization code") || 
                m.Contains("An error occurred during Microsoft login"));
        }
    }
}
