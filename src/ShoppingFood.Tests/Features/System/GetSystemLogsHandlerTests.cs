using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using ShoppingFood.Application.Features.System.Queries;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Log;
using Xunit;

namespace ShoppingFood.Tests.Features.System
{
    public class GetSystemLogsHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly LogContext _logContext;
        private readonly Mock<IMapper> _mapperMock;
        private readonly GetSystemLogsHandler _handler;

        public GetSystemLogsHandlerTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();
            var options = new DbContextOptionsBuilder<LogContext>()
                .UseSqlite(_connection)
                .Options;
            _logContext = new LogContext(options);
            _logContext.Database.EnsureCreated();

            _mapperMock = new Mock<IMapper>();
            _handler = new GetSystemLogsHandler(_logContext, _mapperMock.Object);
        }

        public void Dispose()
        {
            _logContext.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task Handle_Success_ReturnsMappedActionLogs()
        {
            var logs = new List<ActionLog>
            {
                new ActionLog { Id = Guid.NewGuid(), UserName = "User1", Action = "Login", Message = "Success", CreatedAt = DateTime.UtcNow },
                new ActionLog { Id = Guid.NewGuid(), UserName = "User2", Action = "Logout", Message = "Success", CreatedAt = DateTime.UtcNow.AddMinutes(-5) }
            };

            _logContext.ActionLogs.AddRange(logs);
            await _logContext.SaveChangesAsync();

            var dtos = new List<ActionLogDto>
            {
                new ActionLogDto { Id = logs[0].Id, UserName = "User1" },
                new ActionLogDto { Id = logs[1].Id, UserName = "User2" }
            };

            _mapperMock.Setup(m => m.Map<IReadOnlyList<ActionLogDto>>(It.IsAny<List<ActionLog>>()))
                .Returns(dtos.AsReadOnly());

            var query = new GetSystemLogsQuery { Skip = 0, Take = 10 };
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Action logs retrieved successfully.");
            
            var data = result.Data as IReadOnlyList<ActionLogDto>;
            data.Should().NotBeNull();
            data!.Count.Should().Be(2);
        }
        
        [Fact]
        public async Task Handle_WithFilter_ReturnsFilteredLogs()
        {
            var logs = new List<ActionLog>
            {
                new ActionLog { Id = Guid.NewGuid(), UserName = "Admin", Action = "Delete", Message = "Deleted item", CreatedAt = DateTime.UtcNow },
                new ActionLog { Id = Guid.NewGuid(), UserName = "User1", Action = "View", Message = "Viewed item", CreatedAt = DateTime.UtcNow.AddMinutes(-5) }
            };

            _logContext.ActionLogs.AddRange(logs);
            await _logContext.SaveChangesAsync();

            var dtos = new List<ActionLogDto>
            {
                new ActionLogDto { Id = logs[0].Id, UserName = "Admin" }
            };

            _mapperMock.Setup(m => m.Map<IReadOnlyList<ActionLogDto>>(It.IsAny<List<ActionLog>>()))
                .Returns(dtos.AsReadOnly());

            var query = new GetSystemLogsQuery { Filter = "admin", Skip = 0, Take = 10 };
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Total.Should().Be(1);
        }
    }
}
