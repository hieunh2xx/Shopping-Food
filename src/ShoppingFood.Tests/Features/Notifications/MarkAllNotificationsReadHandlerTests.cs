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
    public class MarkAllNotificationsReadHandlerTests
    {
        private readonly Mock<INotificationRepository> _notificationRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly MarkAllNotificationsReadHandler _handler;

        public MarkAllNotificationsReadHandlerTests()
        {
            _notificationRepoMock = new Mock<INotificationRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _handler = new MarkAllNotificationsReadHandler(_notificationRepoMock.Object, _unitOfWorkMock.Object);
        }

        [Fact]
        public async Task Handle_Unauthorized_Returns401()
        {
            var command = new MarkAllNotificationsReadCommand { CurrentUserId = null };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(401);
            result.Message.Should().Be("Unauthorized.");
        }

        [Fact]
        public async Task Handle_Success_MarksAllAsRead()
        {
            var userId = Guid.NewGuid();
            var n1 = new Notification { Id = Guid.NewGuid(), UserId = userId, IsRead = false };
            var n2 = new Notification { Id = Guid.NewGuid(), UserId = userId, IsRead = false };
            
            _notificationRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<Notification, bool>>>(),
                It.IsAny<Func<IQueryable<Notification>, IOrderedQueryable<Notification>>>(),
                It.IsAny<Func<IQueryable<Notification>, IIncludableQueryable<Notification, object>>>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<Notification> { n1, n2 }.AsReadOnly());

            var command = new MarkAllNotificationsReadCommand { CurrentUserId = userId };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("All notifications marked as read successfully.");
            
            n1.IsRead.Should().BeTrue();
            n2.IsRead.Should().BeTrue();
            
            _notificationRepoMock.Verify(r => r.Update(n1), Times.Once);
            _notificationRepoMock.Verify(r => r.Update(n2), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }
    }
}
