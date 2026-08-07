using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using Xunit;

namespace ShoppingFood.Tests.Features.Users
{
    public class VerifyUpdateContactHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ShoppingFoodContext _dbContext;
        private readonly VerifyUpdateContactHandler _handler;

        public VerifyUpdateContactHandlerTests()
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

            _handler = new VerifyUpdateContactHandler(_dbContext);
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task Handle_Unauthorized_Returns401()
        {
            var command = new VerifyUpdateContactCommand { CurrentUserId = Guid.Empty };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(401);
            result.Message.Should().Be("Unauthorized");
        }

        [Fact]
        public async Task Handle_UserNotFound_Returns404()
        {
            var command = new VerifyUpdateContactCommand { CurrentUserId = Guid.NewGuid(), NewEmail = "test@example.com" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(404);
            result.Message.Should().Be("User not found");
        }

        [Fact]
        public async Task Handle_EmptyContacts_Returns400()
        {
            var userId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId });
            await _dbContext.SaveChangesAsync();

            var command = new VerifyUpdateContactCommand { CurrentUserId = userId, NewEmail = "", NewPhone = "" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Must provide either new email or new phone.");
        }

        [Fact]
        public async Task Handle_InvalidOtp_Returns400()
        {
            var userId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId });
            await _dbContext.SaveChangesAsync();

            var command = new VerifyUpdateContactCommand { CurrentUserId = userId, NewEmail = "test@example.com", OtpCode = "123456" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Invalid or expired OTP");
        }

        [Fact]
        public async Task Handle_ExpiredOtp_Returns400_AndIncrementsRetries()
        {
            var userId = Guid.NewGuid();
            var otpId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId });
            _dbContext.OtpRecords.Add(new OtpRecord 
            { 
                Id = otpId, 
                EmailOrPhone = "test@example.com", 
                OtpCode = "123456",
                ExpiryTime = DateTime.UtcNow.AddMinutes(-1), // Expired
                IsUsed = false,
                RetriesCount = 0
            });
            await _dbContext.SaveChangesAsync();

            var command = new VerifyUpdateContactCommand { CurrentUserId = userId, NewEmail = "test@example.com", OtpCode = "123456" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Invalid or expired OTP");

            var otp = await _dbContext.OtpRecords.FindAsync(otpId);
            otp!.RetriesCount.Should().Be(1);
        }

        [Fact]
        public async Task Handle_IpMismatch_Returns400()
        {
            var userId = Guid.NewGuid();
            var otpId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId });
            _dbContext.OtpRecords.Add(new OtpRecord 
            { 
                Id = otpId, 
                EmailOrPhone = "test@example.com", 
                OtpCode = "123456",
                ExpiryTime = DateTime.UtcNow.AddMinutes(5),
                IsUsed = false,
                IpAddress = "192.168.1.1"
            });
            await _dbContext.SaveChangesAsync();

            var command = new VerifyUpdateContactCommand 
            { 
                CurrentUserId = userId, 
                NewEmail = "test@example.com", 
                OtpCode = "123456",
                IpAddress = "10.0.0.1" // Mismatch
            };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Security validation failed. IP mismatch.");
        }

        [Fact]
        public async Task Handle_SuccessEmail_UpdatesEmailAndReturns200()
        {
            var userId = Guid.NewGuid();
            var otpId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId, Email = "old@example.com", IsEmailActive = false });
            _dbContext.OtpRecords.Add(new OtpRecord 
            { 
                Id = otpId, 
                EmailOrPhone = "new@example.com", 
                OtpCode = "123456",
                ExpiryTime = DateTime.UtcNow.AddMinutes(5),
                IsUsed = false,
                IpAddress = "127.0.0.1"
            });
            await _dbContext.SaveChangesAsync();

            var command = new VerifyUpdateContactCommand 
            { 
                CurrentUserId = userId, 
                NewEmail = "new@example.com", 
                OtpCode = "123456",
                IpAddress = "127.0.0.1"
            };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Contact updated successfully");

            var user = await _dbContext.Users.FindAsync(userId);
            user!.Email.Should().Be("new@example.com");
            user.IsEmailActive.Should().BeTrue();

            var otp = await _dbContext.OtpRecords.FindAsync(otpId);
            otp!.IsUsed.Should().BeTrue();
        }

        [Fact]
        public async Task Handle_SuccessPhone_UpdatesPhoneAndReturns200()
        {
            var userId = Guid.NewGuid();
            var otpId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId, Phone = "oldphone" });
            _dbContext.OtpRecords.Add(new OtpRecord 
            { 
                Id = otpId, 
                EmailOrPhone = "newphone", 
                OtpCode = "123456",
                ExpiryTime = DateTime.UtcNow.AddMinutes(5),
                IsUsed = false,
                IpAddress = "127.0.0.1"
            });
            await _dbContext.SaveChangesAsync();

            var command = new VerifyUpdateContactCommand 
            { 
                CurrentUserId = userId, 
                NewPhone = "newphone", 
                OtpCode = "123456",
                IpAddress = "127.0.0.1"
            };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Contact updated successfully");

            var user = await _dbContext.Users.FindAsync(userId);
            user!.Phone.Should().Be("newphone");
        }
    }
}
