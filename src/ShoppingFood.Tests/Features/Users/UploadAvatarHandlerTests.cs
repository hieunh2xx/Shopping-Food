using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using Xunit;

namespace ShoppingFood.Tests.Features.Users
{
    public class UploadAvatarHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ShoppingFoodContext _dbContext;
        private readonly Mock<IPhotoService> _photoServiceMock;
        private readonly UploadAvatarHandler _handler;

        public UploadAvatarHandlerTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseSqlite(_connection)
                .Options;
            _dbContext = new ShoppingFoodContext(options);
            
            var createTablesSql = @"
                CREATE TABLE IF NOT EXISTS USER_ACCOUNT (
                    Id TEXT PRIMARY KEY,
                    Phone TEXT,
                    UserName TEXT,
                    Email TEXT,
                    IsEmailActive INTEGER DEFAULT 0,
                    PasswordHash TEXT,
                    RefreshToken TEXT,
                    RefreshTokenExpiryTime TEXT,
                    DeleteRequestedAt TEXT,
                    Status INTEGER DEFAULT 0,
                    CreatedAt TEXT,
                    UpdatedAt TEXT
                );
                CREATE TABLE IF NOT EXISTS USER_PROFILE (
                    Id TEXT PRIMARY KEY,
                    UserAccountId TEXT,
                    FullName TEXT,
                    AvatarUrl TEXT,
                    Gender TEXT,
                    DateOfBirth TEXT,
                    Role INTEGER DEFAULT 0,
                    CreatedAt TEXT,
                    UpdatedAt TEXT,
                    FOREIGN KEY(UserAccountId) REFERENCES USER_ACCOUNT(Id)
                );";
            
            using (var cmd = _connection.CreateCommand())
            {
                cmd.CommandText = createTablesSql;
                cmd.ExecuteNonQuery();
            }

            _photoServiceMock = new Mock<IPhotoService>();
            _handler = new UploadAvatarHandler(_dbContext, _photoServiceMock.Object);
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Dispose();
        }

        private Mock<IFormFile> CreateMockFile(string fileName, long length = 100)
        {
            var mockFile = new Mock<IFormFile>();
            mockFile.Setup(f => f.FileName).Returns(fileName);
            mockFile.Setup(f => f.Length).Returns(length);
            return mockFile;
        }

        [Fact]
        public async Task Handle_FileIsNull_Returns400()
        {
            var command = new UploadAvatarCommand { CurrentUserId = Guid.NewGuid(), File = null };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Không có file nào được tải lên.");
        }

        [Fact]
        public async Task Handle_FileIsEmpty_Returns400()
        {
            var mockFile = CreateMockFile("test.png", 0);
            var command = new UploadAvatarCommand { CurrentUserId = Guid.NewGuid(), File = mockFile.Object };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Không có file nào được tải lên.");
        }

        [Fact]
        public async Task Handle_UserNotFound_Returns404()
        {
            var mockFile = CreateMockFile("test.png");
            var command = new UploadAvatarCommand { CurrentUserId = Guid.NewGuid(), File = mockFile.Object };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(404);
            result.Message.Should().Be("Không tìm thấy người dùng.");
        }

        [Fact]
        public async Task Handle_InvalidExtension_Returns400()
        {
            var userId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId });
            _dbContext.UserProfiles.Add(new UserProfile { Id = Guid.NewGuid(), UserAccountId = userId });
            await _dbContext.SaveChangesAsync();

            var mockFile = CreateMockFile("test.txt");
            var command = new UploadAvatarCommand { CurrentUserId = userId, File = mockFile.Object };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Chỉ cho phép tải lên các tệp ảnh (.jpg, .jpeg, .png, .webp).");
        }

        [Fact]
        public async Task Handle_CloudinaryUploadFails_Returns500()
        {
            var userId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId });
            _dbContext.UserProfiles.Add(new UserProfile { Id = Guid.NewGuid(), UserAccountId = userId });
            await _dbContext.SaveChangesAsync();

            var mockFile = CreateMockFile("test.png");
            _photoServiceMock.Setup(s => s.AddPhotoAsync(It.IsAny<IFormFile>())).ReturnsAsync((string)null!);

            var command = new UploadAvatarCommand { CurrentUserId = userId, File = mockFile.Object };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(500);
            result.Message.Should().Be("Lỗi khi tải ảnh lên Cloudinary.");
        }

        [Fact]
        public async Task Handle_Success_UpdatesAvatarAndReturns200()
        {
            var userId = Guid.NewGuid();
            var profileId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId });
            _dbContext.UserProfiles.Add(new UserProfile { Id = profileId, UserAccountId = userId, AvatarUrl = "old_url" });
            await _dbContext.SaveChangesAsync();

            var mockFile = CreateMockFile("test.png");
            var newUrl = "https://cloudinary.com/new_url.png";
            _photoServiceMock.Setup(s => s.AddPhotoAsync(It.IsAny<IFormFile>())).ReturnsAsync(newUrl);

            var command = new UploadAvatarCommand { CurrentUserId = userId, File = mockFile.Object };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Cập nhật ảnh đại diện thành công.");

            var profile = await _dbContext.UserProfiles.FindAsync(profileId);
            profile!.AvatarUrl.Should().Be(newUrl);
        }
    }
}
