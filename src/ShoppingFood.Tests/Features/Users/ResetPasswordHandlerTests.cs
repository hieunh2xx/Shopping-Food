using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using Xunit;

namespace ShoppingFood.Tests.Features.Users
{
    public class ResetPasswordHandlerTests : IDisposable
    {
        private readonly ShoppingFoodContext _dbContext;
        private readonly ResetPasswordHandler _handler;

        public ResetPasswordHandlerTests()
        {
            var options = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _dbContext = new ShoppingFoodContext(options);
            _handler = new ResetPasswordHandler(_dbContext);
        }

        public void Dispose()
        {
            _dbContext.Database.EnsureDeleted();
            _dbContext.Dispose();
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }

        [Fact]
        public async Task Handle_EmptyFields_ReturnsBadRequest()
        {
            // Arrange
            var command = new ResetPasswordCommand
            {
                Email = "",
                OtpCode = "",
                NewPassword = ""
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(400);
            result.Message.Should().Be("Vui lòng nhập đầy đủ thông tin.");
        }

        [Fact]
        public async Task Handle_OtpNotFoundOrExpired_ReturnsBadRequest()
        {
            // Arrange
            var email = "user@example.com";
            var command = new ResetPasswordCommand
            {
                Email = email,
                OtpCode = "123456",
                NewPassword = "new_password"
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(400);
            result.Message.Should().Be("Mã OTP không hợp lệ hoặc đã hết hạn.");
        }

        [Fact]
        public async Task Handle_UserNotFound_ReturnsNotFound()
        {
            // Arrange
            var email = "user@example.com";
            var otpCode = "123456";
            var otpRecord = new OtpRecord
            {
                Id = Guid.NewGuid(),
                EmailOrPhone = email,
                OtpCode = otpCode,
                ExpiryTime = DateTime.UtcNow.AddMinutes(5),
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.OtpRecords.Add(otpRecord);
            await _dbContext.SaveChangesAsync();

            var command = new ResetPasswordCommand
            {
                Email = email,
                OtpCode = otpCode,
                NewPassword = "new_password"
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(404);
            result.Message.Should().Be("Không tìm thấy người dùng.");
        }

        [Fact]
        public async Task Handle_NewPasswordSameAsOld_ReturnsBadRequest()
        {
            // Arrange
            var email = "user@example.com";
            var otpCode = "123456";
            var password = "old_password";
            var oldPasswordHash = HashPassword(password);

            var otpRecord = new OtpRecord
            {
                Id = Guid.NewGuid(),
                EmailOrPhone = email,
                OtpCode = otpCode,
                ExpiryTime = DateTime.UtcNow.AddMinutes(5),
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.OtpRecords.Add(otpRecord);

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                PasswordHash = oldPasswordHash
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            var command = new ResetPasswordCommand
            {
                Email = email,
                OtpCode = otpCode,
                NewPassword = password // same as old
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(400);
            result.Message.Should().Be("Mật khẩu mới phải khác mật khẩu cũ.");
        }

        [Fact]
        public async Task Handle_ValidRequest_ResetsPasswordSuccessfully()
        {
            // Arrange
            var email = "user@example.com";
            var otpCode = "123456";
            var oldPasswordHash = HashPassword("old_password");

            var otpRecord = new OtpRecord
            {
                Id = Guid.NewGuid(),
                EmailOrPhone = email,
                OtpCode = otpCode,
                ExpiryTime = DateTime.UtcNow.AddMinutes(5),
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.OtpRecords.Add(otpRecord);

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                PasswordHash = oldPasswordHash
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            var command = new ResetPasswordCommand
            {
                Email = email,
                OtpCode = otpCode,
                NewPassword = "new_password"
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(200);
            result.Message.Should().Be("Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.");

            // Verify OTP marked as used
            var updatedOtp = await _dbContext.OtpRecords.FindAsync(otpRecord.Id);
            updatedOtp!.IsUsed.Should().BeTrue();

            // Verify password updated in database
            var updatedUser = await _dbContext.Users.FindAsync(user.Id);
            updatedUser!.PasswordHash.Should().Be(HashPassword("new_password"));
        }
    }
}
