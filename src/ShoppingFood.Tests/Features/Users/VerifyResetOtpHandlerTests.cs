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
    public class VerifyResetOtpHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ShoppingFoodContext _dbContext;
        private readonly VerifyResetOtpHandler _handler;

        public VerifyResetOtpHandlerTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseSqlite(_connection)
                .Options;
            _dbContext = new ShoppingFoodContext(options);
            
            var createTablesSql = @"
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

            _handler = new VerifyResetOtpHandler(_dbContext);
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task Handle_EmptyParameters_Returns400()
        {
            var command = new VerifyResetOtpCommand { Email = "", OtpCode = "123456" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Vui lòng nhập đầy đủ thông tin.");
        }

        [Fact]
        public async Task Handle_OtpNotFound_Returns400()
        {
            var command = new VerifyResetOtpCommand { Email = "test@example.com", OtpCode = "123456" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Mã OTP không hợp lệ hoặc đã hết hạn.");
        }

        [Fact]
        public async Task Handle_OtpUsed_Returns400()
        {
            _dbContext.OtpRecords.Add(new OtpRecord 
            { 
                Id = Guid.NewGuid(), 
                EmailOrPhone = "test@example.com", 
                OtpCode = "123456", 
                IsUsed = true, 
                ExpiryTime = DateTime.UtcNow.AddMinutes(5) 
            });
            await _dbContext.SaveChangesAsync();

            var command = new VerifyResetOtpCommand { Email = "test@example.com", OtpCode = "123456" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Mã OTP không hợp lệ hoặc đã hết hạn.");
        }

        [Fact]
        public async Task Handle_OtpExpired_Returns400()
        {
            _dbContext.OtpRecords.Add(new OtpRecord 
            { 
                Id = Guid.NewGuid(), 
                EmailOrPhone = "test@example.com", 
                OtpCode = "123456", 
                IsUsed = false, 
                ExpiryTime = DateTime.UtcNow.AddMinutes(-5) // Expired
            });
            await _dbContext.SaveChangesAsync();

            var command = new VerifyResetOtpCommand { Email = "test@example.com", OtpCode = "123456" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Mã OTP không hợp lệ hoặc đã hết hạn.");
        }

        [Fact]
        public async Task Handle_Success_Returns200_DoesNotMarkAsUsed()
        {
            var otpId = Guid.NewGuid();
            _dbContext.OtpRecords.Add(new OtpRecord 
            { 
                Id = otpId, 
                EmailOrPhone = "test@example.com", 
                OtpCode = "123456", 
                IsUsed = false, 
                ExpiryTime = DateTime.UtcNow.AddMinutes(5)
            });
            await _dbContext.SaveChangesAsync();

            var command = new VerifyResetOtpCommand { Email = "test@example.com", OtpCode = "123456" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Mã OTP hợp lệ.");

            var otp = await _dbContext.OtpRecords.FindAsync(otpId);
            otp!.IsUsed.Should().BeFalse(); // Verified but not marked as used yet
        }
    }
}
