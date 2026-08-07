using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore.Query;
using Moq;
using ShoppingFood.Application.Features.Notifications.Queries;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Notification;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Notifications
{
    public class GetNotificationsHandlerTests
    {
        private readonly Mock<INotificationRepository> _notificationRepoMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly GetNotificationsHandler _handler;

        public GetNotificationsHandlerTests()
        {
            _notificationRepoMock = new Mock<INotificationRepository>();
            _mapperMock = new Mock<IMapper>();
            _handler = new GetNotificationsHandler(_notificationRepoMock.Object, _mapperMock.Object);
        }

        [Fact]
        public async Task Handle_Unauthorized_Returns401()
        {
            var query = new GetNotificationsQuery { CurrentUserId = null };
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(401);
            result.Message.Should().Be("Unauthorized.");
        }

        [Fact]
        public async Task Handle_Success_ReturnsMappedNotifications()
        {
            var userId = Guid.NewGuid();
            var notifications = new List<Notification>
            {
                new Notification { Id = Guid.NewGuid(), Title = "Title 1" },
                new Notification { Id = Guid.NewGuid(), Title = "Title 2" }
            };

            _notificationRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<Notification, bool>>>(),
                It.IsAny<Func<IQueryable<Notification>, IOrderedQueryable<Notification>>>(),
                It.IsAny<Func<IQueryable<Notification>, IIncludableQueryable<Notification, object>>>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(notifications.AsReadOnly());

            var dtos = new List<NotificationDto>
            {
                new NotificationDto { Id = notifications[0].Id, Title = notifications[0].Title },
                new NotificationDto { Id = notifications[1].Id, Title = notifications[1].Title }
            };

            _mapperMock.Setup(m => m.Map<List<NotificationDto>>(It.IsAny<IReadOnlyList<Notification>>()))
                .Returns(dtos);

            var query = new GetNotificationsQuery { CurrentUserId = userId };
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Notifications retrieved successfully.");
            
            var data = result.Data as List<NotificationDto>;
            data.Should().NotBeNull();
            data!.Count.Should().Be(2);
            data[0].Title.Should().Be("Title 1");
        }
    }
}
