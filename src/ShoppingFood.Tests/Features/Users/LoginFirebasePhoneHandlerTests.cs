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
using Xunit;

namespace ShoppingFood.Tests.Features.Users
{
    public class LoginFirebasePhoneHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ShoppingFoodContext _dbContext;
        private readonly Mock<IConfiguration> _configMock;
        private readonly LoginFirebasePhoneHandler _handler;

        public LoginFirebasePhoneHandlerTests()
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

            _configMock = new Mock<IConfiguration>();
            _handler = new LoginFirebasePhoneHandler(_dbContext, _configMock.Object);
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task Handle_MissingIdToken_Returns400()
        {
            var command = new LoginFirebasePhoneCommand { IdToken = "" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Firebase ID Token is required.");
        }

        [Fact]
        public async Task Handle_InvalidToken_ThrowsException_Returns401()
        {
            // VerifyIdTokenAsync will throw because Firebase App is not initialized in the test environment
            var command = new LoginFirebasePhoneCommand { IdToken = "invalid_token" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(401);
            result.Message.Should().Contain("Invalid Firebase ID Token");
        }
    }
}
