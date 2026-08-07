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
    public class GetSystemErrorLogsHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly LogContext _logContext;
        private readonly Mock<IMapper> _mapperMock;
        private readonly GetSystemErrorLogsHandler _handler;

        public GetSystemErrorLogsHandlerTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();
            var options = new DbContextOptionsBuilder<LogContext>()
                .UseSqlite(_connection)
                .Options;
            _logContext = new LogContext(options);
            _logContext.Database.EnsureCreated();

            _mapperMock = new Mock<IMapper>();
            _handler = new GetSystemErrorLogsHandler(_logContext, _mapperMock.Object);
        }

        public void Dispose()
        {
            _logContext.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task Handle_Success_ReturnsMappedErrorLogs()
        {
            var logs = new List<ErrorLog>
            {
                new ErrorLog { Id = Guid.NewGuid(), Action = "Action1", ExceptionMessage = "Error 1", CreatedAt = DateTime.UtcNow },
                new ErrorLog { Id = Guid.NewGuid(), Action = "Action2", ExceptionMessage = "Error 2", CreatedAt = DateTime.UtcNow.AddMinutes(-5) }
            };

            _logContext.ErrorLogs.AddRange(logs);
            await _logContext.SaveChangesAsync();

            var dtos = new List<ErrorLogDto>
            {
                new ErrorLogDto { Id = logs[0].Id, Action = "Action1" },
                new ErrorLogDto { Id = logs[1].Id, Action = "Action2" }
            };

            _mapperMock.Setup(m => m.Map<IReadOnlyList<ErrorLogDto>>(It.IsAny<List<ErrorLog>>()))
                .Returns(dtos.AsReadOnly());

            var query = new GetSystemErrorLogsQuery { Skip = 0, Take = 10 };
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Error logs retrieved successfully.");
            
            var data = result.Data as IReadOnlyList<ErrorLogDto>;
            data.Should().NotBeNull();
            data!.Count.Should().Be(2);
        }
        
        [Fact]
        public async Task Handle_WithFilter_ReturnsFilteredLogs()
        {
            var logs = new List<ErrorLog>
            {
                new ErrorLog { Id = Guid.NewGuid(), Action = "Action1", ExceptionMessage = "Database Error", CreatedAt = DateTime.UtcNow },
                new ErrorLog { Id = Guid.NewGuid(), Action = "Action2", ExceptionMessage = "Network Error", CreatedAt = DateTime.UtcNow.AddMinutes(-5) }
            };

            _logContext.ErrorLogs.AddRange(logs);
            await _logContext.SaveChangesAsync();

            var dtos = new List<ErrorLogDto>
            {
                new ErrorLogDto { Id = logs[0].Id, Action = "Action1" }
            };

            _mapperMock.Setup(m => m.Map<IReadOnlyList<ErrorLogDto>>(It.IsAny<List<ErrorLog>>()))
                .Returns(dtos.AsReadOnly());

            var query = new GetSystemErrorLogsQuery { Filter = "database", Skip = 0, Take = 10 };
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Total.Should().Be(1);
        }
    }
}
