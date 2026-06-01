using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;
using Moq.Protected;
using ShoppingFood.Application.Services;
using Xunit;

namespace ShoppingFood.Tests.Services
{
    public class StringeeServiceTests
    {
        [Fact]
        public async Task SendSmsOtpAsync_MissingConfig_ThrowsException()
        {
            // Arrange
            var configMock = new Mock<IConfiguration>();
            configMock.Setup(c => c["StringeeSettings:ApiSidKey"]).Returns(string.Empty);
            configMock.Setup(c => c["StringeeSettings:ApiSecretKey"]).Returns(string.Empty);

            var service = new StringeeService(new HttpClient(), configMock.Object);

            // Act & Assert
            await Assert.ThrowsAsync<System.Exception>(() => service.SendSmsOtpAsync("0987654321", "123456"));
        }

        [Fact]
        public async Task SendSmsOtpAsync_DevMock_ReturnsTrue()
        {
            // Arrange
            var configMock = new Mock<IConfiguration>();
            configMock.Setup(c => c["StringeeSettings:ApiSidKey"]).Returns("SID_MOCK_1234567890");
            configMock.Setup(c => c["StringeeSettings:ApiSecretKey"]).Returns("SECRET_MOCK_SECRET_MOCK_SECRET_MOCK_32_BYTES");
            configMock.Setup(c => c["StringeeSettings:Sender"]).Returns("Stringee"); // Triggers DEV MOCK

            var service = new StringeeService(new HttpClient(), configMock.Object);

            // Act
            var result = await service.SendSmsOtpAsync("0987654321", "123456");

            // Assert
            result.Should().BeTrue();
        }
    }
}
