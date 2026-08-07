using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Moq;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.User;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Users
{
    public class RegisterShipperHandlerTests
    {
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IShipperApplicationRepository> _shipperAppRepoMock;
        private readonly Mock<IUnitOfWork> _uowMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly RegisterShipperHandler _handler;

        public RegisterShipperHandlerTests()
        {
            _userRepoMock = new Mock<IUserRepository>();
            _shipperAppRepoMock = new Mock<IShipperApplicationRepository>();
            _uowMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();

            _handler = new RegisterShipperHandler(
                _userRepoMock.Object,
                _shipperAppRepoMock.Object,
                _uowMock.Object,
                _mapperMock.Object
            );
        }

        [Fact]
        public async Task Handle_Success_Returns200()
        {
            var command = new RegisterShipperCommand 
            { 
                UserName = "testshipper", 
                Password = "password123",
                FullName = "Test Shipper",
                IdentityCardNumber = "123456789",
                VehicleType = VehicleType.Motorcycle
            };

            _mapperMock.Setup(m => m.Map<User>(command)).Returns(new User { UserName = command.UserName });
            _mapperMock.Setup(m => m.Map<UserProfile>(command)).Returns(new UserProfile { FullName = command.FullName });
            _mapperMock.Setup(m => m.Map<ShipperApplication>(command)).Returns(new ShipperApplication { IdentityCardNumber = command.IdentityCardNumber });

            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Shipper registration submitted successfully. Application is pending review.");

            var data = result.Data as ShipperRegisterDto;
            data.Should().NotBeNull();
            data!.UserName.Should().Be("testshipper");
            data.FullName.Should().Be("Test Shipper");
            data.ShipperApplicationStatus.Should().Be(ApplicationStatus.Pending.ToString());

            _userRepoMock.Verify(r => r.Add(It.IsAny<User>()), Times.Once);
            _shipperAppRepoMock.Verify(r => r.Add(It.IsAny<ShipperApplication>()), Times.Once);
            _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task Handle_Exception_Returns400()
        {
            var command = new RegisterShipperCommand();

            _mapperMock.Setup(m => m.Map<User>(command)).Throws(new Exception("Mapping failed"));

            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Contain("Mapping failed");

            _uowMock.Verify(u => u.LogErrorAsync("RegisterShipperHandler.Handle", It.IsAny<Exception>()), Times.Once);
        }
    }
}
