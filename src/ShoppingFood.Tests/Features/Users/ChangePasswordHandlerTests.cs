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
    public class ChangePasswordHandlerTests : IDisposable
    {
        private readonly ShoppingFoodContext _dbContext;
        private readonly ChangePasswordHandler _handler;

        public ChangePasswordHandlerTests()
        {
            var options = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _dbContext = new ShoppingFoodContext(options);
            _handler = new ChangePasswordHandler(_dbContext);
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
        public async Task Handle_EmptyPasswords_ReturnsBadRequest()
        {
            // Arrange
            var command = new ChangePasswordCommand
            {
                CurrentUserId = Guid.NewGuid(),
                OldPassword = "",
                NewPassword = ""
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(400);
            result.Message.Should().Be("Vui lòng nhập đầy đủ mật khẩu cũ và mới.");
        }

        [Fact]
        public async Task Handle_UserNotFound_ReturnsNotFound()
        {
            // Arrange
            var command = new ChangePasswordCommand
            {
                CurrentUserId = Guid.NewGuid(),
                OldPassword = "old_password",
                NewPassword = "new_password"
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(404);
            result.Message.Should().Be("Không tìm thấy người dùng.");
        }

        [Fact]
        public async Task Handle_IncorrectOldPassword_ReturnsBadRequest()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User
            {
                Id = userId,
                PasswordHash = HashPassword("actual_old_password")
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            var command = new ChangePasswordCommand
            {
                CurrentUserId = userId,
                OldPassword = "wrong_old_password",
                NewPassword = "new_password"
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(400);
            result.Message.Should().Be("Mật khẩu cũ không chính xác.");
        }

        [Fact]
        public async Task Handle_ValidRequest_ChangesPasswordSuccessfully()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User
            {
                Id = userId,
                PasswordHash = HashPassword("old_password")
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            var command = new ChangePasswordCommand
            {
                CurrentUserId = userId,
                OldPassword = "old_password",
                NewPassword = "new_password"
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Code.Should().Be(200);
            result.Message.Should().Be("Thay đổi mật khẩu thành công.");

            // Verify updated password in DB
            var updatedUser = await _dbContext.Users.FindAsync(userId);
            updatedUser.Should().NotBeNull();
            updatedUser!.PasswordHash.Should().Be(HashPassword("new_password"));
        }
    }
}
