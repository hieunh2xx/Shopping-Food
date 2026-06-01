using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;
using ShoppingFood.Application.Services;
using Xunit;

namespace ShoppingFood.Tests.Services
{
    public class EmailServiceTests
    {
        [Fact]
        public async Task SendEmailOtpAsync_MissingSmtpConfig_ReturnsFalseOrThrows()
        {
            // Arrange
            var configMock = new Mock<IConfiguration>();
            // Simulating missing configurations causing a parse or null error which EmailService catches and returns false.
            configMock.Setup(c => c["SmtpSettings:Server"]).Returns((string?)null);

            var service = new EmailService(configMock.Object);

            // Act
            var result = await service.SendEmailOtpAsync("test@example.com", "123456");

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task SendEmailOtpAsync_InvalidPort_ReturnsFalse()
        {
            // Arrange
            var configMock = new Mock<IConfiguration>();
            configMock.Setup(c => c["SmtpSettings:Server"]).Returns("smtp.gmail.com");
            configMock.Setup(c => c["SmtpSettings:Port"]).Returns("invalid-port"); // Causes parse exception

            var service = new EmailService(configMock.Object);

            // Act
            var result = await service.SendEmailOtpAsync("test@example.com", "123456");

            // Assert
            result.Should().BeFalse();
        }
    }
}
