using System;
using System.Linq;
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
    public class RequestUpdateContactHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ShoppingFoodContext _dbContext;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<IStringeeService> _stringeeServiceMock;
        private readonly RequestUpdateContactHandler _handler;

        public RequestUpdateContactHandlerTests()
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

            _emailServiceMock = new Mock<IEmailService>();
            _stringeeServiceMock = new Mock<IStringeeService>();
            
            _handler = new RequestUpdateContactHandler(_dbContext, _emailServiceMock.Object, _stringeeServiceMock.Object);
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task Handle_Unauthorized_Returns401()
        {
            var command = new RequestUpdateContactCommand { CurrentUserId = Guid.Empty };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(401);
            result.Message.Should().Be("Unauthorized");
        }

        [Fact]
        public async Task Handle_UserNotFound_Returns404()
        {
            var command = new RequestUpdateContactCommand { CurrentUserId = Guid.NewGuid(), NewEmail = "test@example.com" };
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

            var command = new RequestUpdateContactCommand { CurrentUserId = userId, NewEmail = "", NewPhone = "" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Must provide either new email or new phone.");
        }

        [Fact]
        public async Task Handle_EmailAlreadyExists_Returns400()
        {
            var userId1 = Guid.NewGuid();
            var userId2 = Guid.NewGuid();
            
            _dbContext.Users.Add(new User { Id = userId1 });
            _dbContext.Users.Add(new User { Id = userId2, Email = "existing@example.com" });
            await _dbContext.SaveChangesAsync();

            var command = new RequestUpdateContactCommand { CurrentUserId = userId1, NewEmail = "existing@example.com" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Email already exists.");
        }

        [Fact]
        public async Task Handle_PhoneAlreadyExists_Returns400()
        {
            var userId1 = Guid.NewGuid();
            var userId2 = Guid.NewGuid();
            
            _dbContext.Users.Add(new User { Id = userId1 });
            _dbContext.Users.Add(new User { Id = userId2, Phone = "0123456789" });
            await _dbContext.SaveChangesAsync();

            var command = new RequestUpdateContactCommand { CurrentUserId = userId1, NewPhone = "0123456789" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Phone number already exists.");
        }

        [Fact]
        public async Task Handle_TooManyOtps_Returns429()
        {
            var userId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId });
            
            // Add 5 recent OTPs
            for (int i = 0; i < 5; i++)
            {
                _dbContext.OtpRecords.Add(new OtpRecord 
                { 
                    Id = Guid.NewGuid(), 
                    EmailOrPhone = "new@example.com", 
                    CreatedAt = DateTime.UtcNow 
                });
            }
            await _dbContext.SaveChangesAsync();

            var command = new RequestUpdateContactCommand { CurrentUserId = userId, NewEmail = "new@example.com" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(429);
            result.Message.Should().Contain("Quá nhiều yêu cầu OTP");
        }

        [Fact]
        public async Task Handle_ValidNewEmail_SendsEmailOtp_Returns200()
        {
            var userId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId });
            
            // Add an old unused OTP to test invalidation
            var oldOtp = new OtpRecord { Id = Guid.NewGuid(), EmailOrPhone = "new@example.com", IsUsed = false, CreatedAt = DateTime.UtcNow.AddMinutes(-20) };
            _dbContext.OtpRecords.Add(oldOtp);
            await _dbContext.SaveChangesAsync();

            _emailServiceMock.Setup(s => s.SendEmailOtpAsync("new@example.com", It.IsAny<string>())).ReturnsAsync(true);

            var command = new RequestUpdateContactCommand { CurrentUserId = userId, NewEmail = "new@example.com" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("OTP sent to new contact for verification");

            var updatedOldOtp = await _dbContext.OtpRecords.FindAsync(oldOtp.Id);
            updatedOldOtp!.IsUsed.Should().BeTrue();

            var newOtp = await _dbContext.OtpRecords.OrderByDescending(o => o.CreatedAt).FirstOrDefaultAsync(o => o.EmailOrPhone == "new@example.com");
            newOtp.Should().NotBeNull();
            newOtp!.IsUsed.Should().BeFalse();
            
            _emailServiceMock.Verify(s => s.SendEmailOtpAsync("new@example.com", It.IsAny<string>()), Times.Once);
            _stringeeServiceMock.Verify(s => s.SendSmsOtpAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task Handle_ValidNewPhone_SendsSmsOtp_Returns200()
        {
            var userId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId });
            await _dbContext.SaveChangesAsync();

            _stringeeServiceMock.Setup(s => s.SendSmsOtpAsync("0987654321", It.IsAny<string>())).ReturnsAsync(true);

            var command = new RequestUpdateContactCommand { CurrentUserId = userId, NewPhone = "0987654321" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            
            _stringeeServiceMock.Verify(s => s.SendSmsOtpAsync("0987654321", It.IsAny<string>()), Times.Once);
            _emailServiceMock.Verify(s => s.SendEmailOtpAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }
        
        [Fact]
        public async Task Handle_ServiceFails_Returns500()
        {
            var userId = Guid.NewGuid();
            _dbContext.Users.Add(new User { Id = userId });
            await _dbContext.SaveChangesAsync();

            _emailServiceMock.Setup(s => s.SendEmailOtpAsync("new@example.com", It.IsAny<string>())).ReturnsAsync(false);

            var command = new RequestUpdateContactCommand { CurrentUserId = userId, NewEmail = "new@example.com" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(500);
            result.Message.Should().Be("Failed to send OTP to the new contact");
        }
    }
}
