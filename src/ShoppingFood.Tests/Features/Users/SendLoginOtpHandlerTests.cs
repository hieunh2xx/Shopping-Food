using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Security;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using Xunit;

namespace ShoppingFood.Tests.Features.Users
{
    public class SendLoginOtpHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ShoppingFoodContext _dbContext;
        private readonly Mock<IConfiguration> _configMock;
        private readonly Mock<IStringeeService> _stringeeServiceMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly SendLoginOtpHandler _handler;

        public SendLoginOtpHandlerTests()
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
                CREATE TABLE IF NOT EXISTS OTP_RECORD (
                    Id TEXT PRIMARY KEY,
                    EmailOrPhone TEXT,
                    OtpCode TEXT,
                    ExpiryTime TEXT,
                    RetriesCount INTEGER DEFAULT 0,
                    IpAddress TEXT,
                    IsUsed INTEGER DEFAULT 0,
                    CreatedAt TEXT,
                    UpdatedAt TEXT
                );";
            
            using (var cmd = _connection.CreateCommand())
            {
                cmd.CommandText = createTablesSql;
                cmd.ExecuteNonQuery();
            }

            _configMock = new Mock<IConfiguration>();
            _stringeeServiceMock = new Mock<IStringeeService>();
            _emailServiceMock = new Mock<IEmailService>();
            
            _configMock.Setup(c => c["JwtSettings:Secret"]).Returns("SuperSecretShoppingFoodKey1234567890SecretSignatureKeyRequiredForTestingTokens");
            _configMock.Setup(c => c["JwtSettings:Issuer"]).Returns("Issuer");
            _configMock.Setup(c => c["JwtSettings:Audience"]).Returns("Audience");
            _configMock.Setup(c => c.GetSection("JwtSettings")["Secret"]).Returns("SuperSecretShoppingFoodKey1234567890SecretSignatureKeyRequiredForTestingTokens");


            _handler = new SendLoginOtpHandler(_dbContext, _configMock.Object, _stringeeServiceMock.Object, _emailServiceMock.Object);
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task Handle_EmptyToken_Returns400()
        {
            var command = new SendLoginOtpCommand { PreAuthToken = "", Method = "email" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("PreAuthToken is required");
        }

        [Fact]
        public async Task Handle_InvalidToken_Returns401()
        {
            var command = new SendLoginOtpCommand { PreAuthToken = "invalid_token", Method = "email" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(401);
            result.Message.Should().Be("Invalid PreAuthToken");
        }

        [Fact]
        public async Task Handle_UserNotFound_Returns404()
        {
            var token = TokenHelper.GenerateToken("testuser", _configMock.Object["JwtSettings:Secret"]!, "Issuer", "Audience");
            var command = new SendLoginOtpCommand { PreAuthToken = token, Method = "email" };
            
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(404);
            result.Message.Should().Be("User not found");
        }

        [Fact]
        public async Task Handle_InvalidMethod_Returns400()
        {
            var userId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId, UserName = "testuser" });
            await _dbContext.SaveChangesAsync();

            var token = TokenHelper.GenerateToken("testuser", _configMock.Object["JwtSettings:Secret"]!, "Issuer", "Audience");
            var command = new SendLoginOtpCommand { PreAuthToken = token, Method = "invalid_method" };
            
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Invalid OTP method or contact not available");
        }

        [Fact]
        public async Task Handle_ContactNotAvailable_Returns400()
        {
            var userId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId, UserName = "testuser", Email = null }); // No email
            await _dbContext.SaveChangesAsync();

            var token = TokenHelper.GenerateToken("testuser", _configMock.Object["JwtSettings:Secret"]!, "Issuer", "Audience");
            var command = new SendLoginOtpCommand { PreAuthToken = token, Method = "email" };
            
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Invalid OTP method or contact not available");
        }

        [Fact]
        public async Task Handle_TooManyOtps_Returns429()
        {
            var userId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId, UserName = "testuser", Email = "test@example.com" });
            
            for (int i = 0; i < 5; i++)
            {
                _dbContext.OtpRecords.Add(new OtpRecord 
                { 
                    Id = Guid.NewGuid(), 
                    EmailOrPhone = "test@example.com", 
                    CreatedAt = DateTime.UtcNow 
                });
            }
            await _dbContext.SaveChangesAsync();

            var token = TokenHelper.GenerateToken("testuser", _configMock.Object["JwtSettings:Secret"]!, "Issuer", "Audience");
            var command = new SendLoginOtpCommand { PreAuthToken = token, Method = "email" };
            
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(429);
            result.Message.Should().Contain("Quá nhiều yêu cầu OTP");
        }

        [Fact]
        public async Task Handle_SuccessEmail_Returns200()
        {
            var userId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId, UserName = "testuser", Email = "test@example.com" });
            
            var oldOtp = new OtpRecord { Id = Guid.NewGuid(), EmailOrPhone = "test@example.com", IsUsed = false, CreatedAt = DateTime.UtcNow.AddMinutes(-20) };
            _dbContext.OtpRecords.Add(oldOtp);
            await _dbContext.SaveChangesAsync();

            _emailServiceMock.Setup(s => s.SendEmailOtpAsync("test@example.com", It.IsAny<string>())).ReturnsAsync(true);

            var token = TokenHelper.GenerateToken("testuser", _configMock.Object["JwtSettings:Secret"]!, "Issuer", "Audience");
            var command = new SendLoginOtpCommand { PreAuthToken = token, Method = "email" };
            
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("OTP sent successfully");

            var updatedOldOtp = await _dbContext.OtpRecords.FindAsync(oldOtp.Id);
            updatedOldOtp!.IsUsed.Should().BeTrue();

            _emailServiceMock.Verify(s => s.SendEmailOtpAsync("test@example.com", It.IsAny<string>()), Times.Once);
            _stringeeServiceMock.Verify(s => s.SendSmsOtpAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task Handle_SuccessPhone_Returns200()
        {
            var userId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId, UserName = "testuser", Phone = "0123456789" });
            await _dbContext.SaveChangesAsync();

            _stringeeServiceMock.Setup(s => s.SendSmsOtpAsync("0123456789", It.IsAny<string>())).ReturnsAsync(true);

            var token = TokenHelper.GenerateToken("testuser", _configMock.Object["JwtSettings:Secret"]!, "Issuer", "Audience");
            var command = new SendLoginOtpCommand { PreAuthToken = token, Method = "phone" };
            
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);

            _stringeeServiceMock.Verify(s => s.SendSmsOtpAsync("0123456789", It.IsAny<string>()), Times.Once);
            _emailServiceMock.Verify(s => s.SendEmailOtpAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task Handle_SendFails_Returns500()
        {
            var userId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId, UserName = "testuser", Email = "test@example.com" });
            await _dbContext.SaveChangesAsync();

            _emailServiceMock.Setup(s => s.SendEmailOtpAsync("test@example.com", It.IsAny<string>())).ReturnsAsync(false);

            var token = TokenHelper.GenerateToken("testuser", _configMock.Object["JwtSettings:Secret"]!, "Issuer", "Audience");
            var command = new SendLoginOtpCommand { PreAuthToken = token, Method = "email" };
            
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(500);
            result.Message.Should().Be("Failed to send OTP");
        }
    }
}
