using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.User;
using Xunit;

namespace ShoppingFood.Tests.Features.Users
{
    public class LoginByPhoneHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ShoppingFoodContext _dbContext;
        private readonly Mock<IConfiguration> _configMock;
        private readonly LoginByPhoneHandler _handler;

        public LoginByPhoneHandlerTests()
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
                );";
            
            using (var cmd = _connection.CreateCommand())
            {
                cmd.CommandText = createTablesSql;
                cmd.ExecuteNonQuery();
            }

            _configMock = new Mock<IConfiguration>();
            _configMock.Setup(c => c["JwtSettings:Secret"]).Returns("SuperSecretShoppingFoodKey1234567890ThisNeedsToBeLongEnough");
            _configMock.Setup(c => c["JwtSettings:Issuer"]).Returns("Issuer");
            _configMock.Setup(c => c["JwtSettings:Audience"]).Returns("Audience");

            _handler = new LoginByPhoneHandler(_dbContext, _configMock.Object);
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task Handle_MissingPhoneOrOtp_Returns400()
        {
            var command = new LoginByPhoneCommand { Phone = "", OtpCode = "" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Phone and OTP code are required.");
        }

        [Fact]
        public async Task Handle_InvalidOtp_Returns400()
        {
            var command = new LoginByPhoneCommand { Phone = "0123456789", OtpCode = "123456" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Invalid OTP.");
        }

        [Fact]
        public async Task Handle_ExpiredOtp_Returns400()
        {
            var otpRecord = new OtpRecord 
            { 
                Id = Guid.NewGuid(), 
                EmailOrPhone = "0123456789", 
                OtpCode = "123456", 
                ExpiryTime = DateTime.UtcNow.AddMinutes(-5), 
                IsUsed = false 
            };
            _dbContext.OtpRecords.Add(otpRecord);
            await _dbContext.SaveChangesAsync();

            var command = new LoginByPhoneCommand { Phone = "0123456789", OtpCode = "123456" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("OTP has expired.");
        }

        [Fact]
        public async Task Handle_ValidOtp_NewUser_Success_ReturnsLoginResponse()
        {
            var otpRecord = new OtpRecord 
            { 
                Id = Guid.NewGuid(), 
                EmailOrPhone = "0123456789", 
                OtpCode = "123456", 
                ExpiryTime = DateTime.UtcNow.AddMinutes(5), 
                IsUsed = false 
            };
            _dbContext.OtpRecords.Add(otpRecord);
            await _dbContext.SaveChangesAsync();

            var command = new LoginByPhoneCommand { Phone = "0123456789", OtpCode = "123456" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Login successful");
            
            var data = result.Data as LoginResponseDto;
            data.Should().NotBeNull();
            data!.Token.Should().NotBeNullOrEmpty();
            data.RefreshToken.Should().NotBeNullOrEmpty();
            
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Phone == "0123456789");
            user.Should().NotBeNull();
            user!.RefreshToken.Should().NotBeNullOrEmpty();
            
            var otpInDb = await _dbContext.OtpRecords.FindAsync(otpRecord.Id);
            otpInDb!.IsUsed.Should().BeTrue();
        }
    }
}
