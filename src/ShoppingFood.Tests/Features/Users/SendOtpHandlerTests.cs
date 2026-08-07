using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
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
    public class SendOtpHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ShoppingFoodContext _dbContext;
        private readonly Mock<IStringeeService> _stringeeServiceMock;
        private readonly SendOtpHandler _handler;

        public SendOtpHandlerTests()
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

            _stringeeServiceMock = new Mock<IStringeeService>();
            
            _handler = new SendOtpHandler(_dbContext, _stringeeServiceMock.Object);
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task Handle_EmptyPhone_Returns400()
        {
            var command = new SendOtpCommand { Phone = "" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Phone number is required");
        }

        [Fact]
        public async Task Handle_InvalidPhoneFormat_Returns400()
        {
            var command = new SendOtpCommand { Phone = "123456" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Invalid phone number format");
        }

        [Fact]
        public async Task Handle_TooManyOtps_Returns429()
        {
            var phone = "0987654321";
            for (int i = 0; i < 5; i++)
            {
                _dbContext.OtpRecords.Add(new OtpRecord 
                { 
                    Id = Guid.NewGuid(), 
                    EmailOrPhone = phone, 
                    CreatedAt = DateTime.UtcNow 
                });
            }
            await _dbContext.SaveChangesAsync();

            var command = new SendOtpCommand { Phone = phone };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(429);
            result.Message.Should().Contain("Quá nhiều yêu cầu OTP");
        }

        [Fact]
        public async Task Handle_SmsFails_Returns500()
        {
            var phone = "0987654321";
            _stringeeServiceMock.Setup(s => s.SendSmsOtpAsync(phone, It.IsAny<string>())).ReturnsAsync(false);

            var command = new SendOtpCommand { Phone = phone };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(500);
            result.Message.Should().Be("Failed to send OTP SMS");
        }

        [Fact]
        public async Task Handle_Success_Returns200()
        {
            var phone = "0987654321";
            var oldOtp = new OtpRecord { Id = Guid.NewGuid(), EmailOrPhone = phone, IsUsed = false, CreatedAt = DateTime.UtcNow.AddMinutes(-20) };
            _dbContext.OtpRecords.Add(oldOtp);
            await _dbContext.SaveChangesAsync();

            _stringeeServiceMock.Setup(s => s.SendSmsOtpAsync(phone, It.IsAny<string>())).ReturnsAsync(true);

            var command = new SendOtpCommand { Phone = phone };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("OTP sent successfully");

            var updatedOldOtp = await _dbContext.OtpRecords.FindAsync(oldOtp.Id);
            updatedOldOtp!.IsUsed.Should().BeTrue();

            _stringeeServiceMock.Verify(s => s.SendSmsOtpAsync(phone, It.IsAny<string>()), Times.Once);
        }
    }
}
