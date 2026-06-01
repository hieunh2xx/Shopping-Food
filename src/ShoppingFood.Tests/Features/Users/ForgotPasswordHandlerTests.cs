using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using Xunit;

namespace ShoppingFood.Tests.Features.Users
{
    public class ForgotPasswordHandlerTests : IDisposable
    {
        private readonly ShoppingFoodContext _dbContext;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly ForgotPasswordHandler _handler;

        public ForgotPasswordHandlerTests()
        {
            var options = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _dbContext = new ShoppingFoodContext(options);
            _emailServiceMock = new Mock<IEmailService>();
            _handler = new ForgotPasswordHandler(_dbContext, _emailServiceMock.Object);
        }

        public void Dispose()
        {
            _dbContext.Database.EnsureDeleted();
            _dbContext.Dispose();
        }

        [Fact]
        public async Task Handle_EmptyEmail_ReturnsBadRequest()
        {
            // Arrange
            var command = new ForgotPasswordCommand { Email = "" };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(400);
            result.Message.Should().Be("Vui lòng nhập Email.");
        }

        [Fact]
        public async Task Handle_EmailNotFound_ReturnsNotFound()
        {
            // Arrange
            var command = new ForgotPasswordCommand { Email = "nonexistent@example.com" };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(404);
            result.Message.Should().Be("Không tìm thấy tài khoản với email này.");
        }

        [Fact]
        public async Task Handle_EmailFound_SendsOtp_ReturnsSuccess()
        {
            // Arrange
            var email = "user@example.com";
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = email
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            _emailServiceMock
                .Setup(e => e.SendEmailOtpAsync(email, It.IsAny<string>()))
                .ReturnsAsync(true);

            var command = new ForgotPasswordCommand { Email = email };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(200);
            result.Message.Should().Be("Mã xác nhận OTP đã được gửi đến email của bạn.");

            // Verify OTP saved in database
            var otpRecord = await _dbContext.OtpRecords.FirstOrDefaultAsync(o => o.EmailOrPhone == email);
            otpRecord.Should().NotBeNull();
            otpRecord!.OtpCode.Should().HaveLength(6);
            otpRecord.IsUsed.Should().BeFalse();
        }

        [Fact]
        public async Task Handle_EmailServiceFails_ReturnsInternalError()
        {
            // Arrange
            var email = "user@example.com";
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = email
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            _emailServiceMock
                .Setup(e => e.SendEmailOtpAsync(email, It.IsAny<string>()))
                .ReturnsAsync(false);

            var command = new ForgotPasswordCommand { Email = email };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(500);
            result.Message.Should().Be("Không thể gửi email OTP lúc này. Vui lòng thử lại sau.");
        }
    }
}
