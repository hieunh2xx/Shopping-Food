using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Core.Security;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using Xunit;

namespace ShoppingFood.Tests.Features.Users
{
    public class VerifyLoginOtpHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ShoppingFoodContext _dbContext;
        private readonly Mock<IConfiguration> _configMock;
        private readonly VerifyLoginOtpHandler _handler;

        public VerifyLoginOtpHandlerTests()
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
                );
                CREATE TABLE IF NOT EXISTS TRUSTED_DEVICE (
                    Id TEXT PRIMARY KEY,
                    UserAccountId TEXT,
                    IpAddress TEXT,
                    TrustedAt TEXT,
                    ExpiresAt TEXT,
                    FOREIGN KEY(UserAccountId) REFERENCES USER_ACCOUNT(Id)
                );";
            
            using (var cmd = _connection.CreateCommand())
            {
                cmd.CommandText = createTablesSql;
                cmd.ExecuteNonQuery();
            }

            _configMock = new Mock<IConfiguration>();
            
            _configMock.Setup(c => c["JwtSettings:Secret"]).Returns("SuperSecretShoppingFoodKey1234567890SecretSignatureKeyRequiredForTestingTokens");
            _configMock.Setup(c => c["JwtSettings:Issuer"]).Returns("Issuer");
            _configMock.Setup(c => c["JwtSettings:Audience"]).Returns("Audience");
            _configMock.Setup(c => c.GetSection("JwtSettings")["Secret"]).Returns("SuperSecretShoppingFoodKey1234567890SecretSignatureKeyRequiredForTestingTokens");

            _handler = new VerifyLoginOtpHandler(_dbContext, _configMock.Object);
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task Handle_EmptyParameters_Returns400()
        {
            var command = new VerifyLoginOtpCommand { PreAuthToken = "", OtpCode = "123456" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("PreAuthToken and OTP are required");
        }

        [Fact]
        public async Task Handle_InvalidToken_Returns401()
        {
            var command = new VerifyLoginOtpCommand { PreAuthToken = "invalid", OtpCode = "123456" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(401);
            result.Message.Should().Be("Invalid PreAuthToken");
        }

        [Fact]
        public async Task Handle_UserNotFound_Returns404()
        {
            var token = TokenHelper.GenerateToken("testuser", _configMock.Object["JwtSettings:Secret"]!, "Issuer", "Audience");
            var command = new VerifyLoginOtpCommand { PreAuthToken = token, OtpCode = "123456" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(404);
            result.Message.Should().Be("User not found");
        }

        [Fact]
        public async Task Handle_InvalidOtp_Returns400()
        {
            var userId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId, UserName = "testuser", Email = "test@example.com" });
            await _dbContext.SaveChangesAsync();

            var token = TokenHelper.GenerateToken("testuser", _configMock.Object["JwtSettings:Secret"]!, "Issuer", "Audience");
            var command = new VerifyLoginOtpCommand { PreAuthToken = token, OtpCode = "123456" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Invalid OTP.");
        }

        [Fact]
        public async Task Handle_ExpiredOtp_Returns400()
        {
            var userId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId, UserName = "testuser", Email = "test@example.com" });
            _dbContext.OtpRecords.Add(new OtpRecord 
            { 
                Id = Guid.NewGuid(), 
                EmailOrPhone = "test@example.com", 
                OtpCode = "123456", 
                IsUsed = false, 
                ExpiryTime = DateTime.UtcNow.AddMinutes(-1) 
            });
            await _dbContext.SaveChangesAsync();

            var token = TokenHelper.GenerateToken("testuser", _configMock.Object["JwtSettings:Secret"]!, "Issuer", "Audience");
            var command = new VerifyLoginOtpCommand { PreAuthToken = token, OtpCode = "123456" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("OTP has expired.");
        }

        [Fact]
        public async Task Handle_Success_NewDevice_Returns200()
        {
            var userId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId, UserName = "testuser", Email = "test@example.com" });
            _dbContext.UserProfiles.Add(new UserProfile { Id = Guid.NewGuid(), UserAccountId = userId, FullName = "Test User" });
            var otpId = Guid.NewGuid();
            _dbContext.OtpRecords.Add(new OtpRecord 
            { 
                Id = otpId, 
                EmailOrPhone = "test@example.com", 
                OtpCode = "123456", 
                IsUsed = false, 
                ExpiryTime = DateTime.UtcNow.AddMinutes(5),
                IpAddress = "192.168.1.1"
            });
            await _dbContext.SaveChangesAsync();

            var token = TokenHelper.GenerateToken("testuser", _configMock.Object["JwtSettings:Secret"]!, "Issuer", "Audience");
            var command = new VerifyLoginOtpCommand { PreAuthToken = token, OtpCode = "123456", IpAddress = "192.168.1.1" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Verification successful");

            var otp = await _dbContext.OtpRecords.FindAsync(otpId);
            otp!.IsUsed.Should().BeTrue();

            var user = await _dbContext.Users.FindAsync(userId);
            user!.RefreshToken.Should().NotBeNullOrEmpty();

            var device = await _dbContext.TrustedDevices.FirstOrDefaultAsync(d => d.UserAccountId == userId);
            device.Should().NotBeNull();
            device!.IpAddress.Should().Be("192.168.1.1");
        }
        
        [Fact]
        public async Task Handle_Success_ExistingDevice_Returns200()
        {
            var userId = Guid.NewGuid();
            var deviceId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId, UserName = "testuser", Email = "test@example.com" });
            _dbContext.UserProfiles.Add(new UserProfile { Id = Guid.NewGuid(), UserAccountId = userId, FullName = "Test User" });
            _dbContext.TrustedDevices.Add(new TrustedDevice { Id = deviceId, UserAccountId = userId, IpAddress = "192.168.1.1", TrustedAt = DateTime.UtcNow.AddDays(-10), ExpiresAt = DateTime.UtcNow.AddDays(20) });
            _dbContext.OtpRecords.Add(new OtpRecord 
            { 
                Id = Guid.NewGuid(), 
                EmailOrPhone = "test@example.com", 
                OtpCode = "123456", 
                IsUsed = false, 
                ExpiryTime = DateTime.UtcNow.AddMinutes(5),
                IpAddress = "192.168.1.1"
            });
            await _dbContext.SaveChangesAsync();

            var token = TokenHelper.GenerateToken("testuser", _configMock.Object["JwtSettings:Secret"]!, "Issuer", "Audience");
            var command = new VerifyLoginOtpCommand { PreAuthToken = token, OtpCode = "123456", IpAddress = "192.168.1.1" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);

            var device = await _dbContext.TrustedDevices.FindAsync(deviceId);
            // It should be updated to extend expiration by 30 days
            device!.ExpiresAt.Should().BeCloseTo(DateTime.UtcNow.AddDays(30), TimeSpan.FromMinutes(1));
        }
    }
}
