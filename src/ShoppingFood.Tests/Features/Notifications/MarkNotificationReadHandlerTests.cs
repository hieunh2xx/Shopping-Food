using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore.Query;
using Moq;
using ShoppingFood.Application.Features.Notifications.Commands;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Notifications
{
    public class MarkNotificationReadHandlerTests
    {
        private readonly Mock<INotificationRepository> _notificationRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly MarkNotificationReadHandler _handler;

        public MarkNotificationReadHandlerTests()
        {
            _notificationRepoMock = new Mock<INotificationRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _handler = new MarkNotificationReadHandler(_notificationRepoMock.Object, _unitOfWorkMock.Object);
        }

        [Fact]
        public async Task Handle_Unauthorized_Returns401()
        {
            var command = new MarkNotificationReadCommand { CurrentUserId = null };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(401);
            result.Message.Should().Be("Unauthorized.");
        }

        [Fact]
        public async Task Handle_NotificationNotFound_Returns404()
        {
            _notificationRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<Notification, bool>>>(),
                It.IsAny<Func<IQueryable<Notification>, IOrderedQueryable<Notification>>>(),
                It.IsAny<Func<IQueryable<Notification>, IIncludableQueryable<Notification, object>>>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<Notification>().AsReadOnly());

            var command = new MarkNotificationReadCommand { CurrentUserId = Guid.NewGuid(), NotificationId = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(404);
            result.Message.Should().Be("Notification not found.");
        }

        [Fact]
        public async Task Handle_NotNotificationOwner_Returns403()
        {
            var userId = Guid.NewGuid();
            var ownerId = Guid.NewGuid();
            var notification = new Notification { Id = Guid.NewGuid(), UserId = ownerId };
            
            _notificationRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<Notification, bool>>>(),
                It.IsAny<Func<IQueryable<Notification>, IOrderedQueryable<Notification>>>(),
                It.IsAny<Func<IQueryable<Notification>, IIncludableQueryable<Notification, object>>>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<Notification> { notification }.AsReadOnly());

            var command = new MarkNotificationReadCommand { CurrentUserId = userId, NotificationId = notification.Id };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(403);
            result.Message.Should().Be("Access denied. You cannot read this notification.");
        }

        [Fact]
        public async Task Handle_Success_MarksAsRead()
        {
            var userId = Guid.NewGuid();
            var notification = new Notification { Id = Guid.NewGuid(), UserId = userId, IsRead = false };
            
            _notificationRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<Notification, bool>>>(),
                It.IsAny<Func<IQueryable<Notification>, IOrderedQueryable<Notification>>>(),
                It.IsAny<Func<IQueryable<Notification>, IIncludableQueryable<Notification, object>>>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<Notification> { notification }.AsReadOnly());

            var command = new MarkNotificationReadCommand { CurrentUserId = userId, NotificationId = notification.Id };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Notification marked as read successfully.");
            
            notification.IsRead.Should().BeTrue();
            
            _notificationRepoMock.Verify(r => r.Update(notification), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }
    }
}
