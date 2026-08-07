using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Moq;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.User;
using ShoppingFood.Repository.Interfaces;
using Xunit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;

namespace ShoppingFood.Tests.Features.Users
{
    public class AddUserHandlerTests : IDisposable
    {
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly SqliteConnection _connection;
        private readonly ShoppingFoodContext _dbContext;
        private readonly AddUserHandler _handler;

        public AddUserHandlerTests()
        {
            _userRepoMock = new Mock<IUserRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();

            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseSqlite(_connection)
                .Options;
            _dbContext = new ShoppingFoodContext(options);
            
            // Raw SQL schema creation since EnsureCreated has issues with nvarchar(max) in EF Core SQLite
            var createTablesSql = @"
                CREATE TABLE IF NOT EXISTS Users (
                    Id TEXT PRIMARY KEY,
                    Phone TEXT,
                    Email TEXT,
                    PasswordHash TEXT,
                    Status INTEGER DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS UserProfiles (
                    Id TEXT PRIMARY KEY,
                    UserAccountId TEXT,
                    FullName TEXT,
                    AvatarUrl TEXT,
                    Role INTEGER DEFAULT 0,
                    CreatedAt TEXT,
                    UpdatedAt TEXT,
                    FOREIGN KEY(UserAccountId) REFERENCES Users(Id)
                );";
            
            using (var cmd = _connection.CreateCommand())
            {
                cmd.CommandText = createTablesSql;
                cmd.ExecuteNonQuery();
            }

            _handler = new AddUserHandler(_userRepoMock.Object, _unitOfWorkMock.Object, _mapperMock.Object, _dbContext);
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task Handle_EmptyToken_Returns400()
        {
            var command = new AddUserCommand { OtpCode = "", IdToken = "" };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Firebase ID Token is required for registration.");
        }

        [Fact]
        public async Task Handle_BypassToken_Success_CreatesUser()
        {
            var command = new AddUserCommand 
            { 
                OtpCode = "bypass",
                Phone = "0987654321",
                Password = "password123",
                FullName = "Test User",
                Role = UserRole.Customer
            };

            var user = new User { Phone = command.Phone };
            _mapperMock.Setup(m => m.Map<User>(command)).Returns(user);
            
            var expectedDto = new UserDto { Id = Guid.NewGuid(), Phone = command.Phone };
            _mapperMock.Setup(m => m.Map<UserDto>(user)).Returns(expectedDto);

            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("User registered successfully");
            
            _userRepoMock.Verify(r => r.Add(user), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
            
            user.PasswordHash.Should().NotBeNullOrEmpty();
            user.Profile.Should().NotBeNull();
            user.Profile.FullName.Should().Be(command.FullName);
        }
        
        [Fact]
        public async Task Handle_Exception_Returns400AndLogsError()
        {
            var command = new AddUserCommand 
            { 
                OtpCode = "bypass"
            };

            var user = new User();
            _mapperMock.Setup(m => m.Map<User>(command)).Returns(user);
            
            _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ThrowsAsync(new Exception("DB Error"));

            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Contain("DB Error");
            
            _unitOfWorkMock.Verify(u => u.LogErrorAsync("AddUserHandler.Handle", It.IsAny<Exception>()), Times.Once);
        }
    }
}
