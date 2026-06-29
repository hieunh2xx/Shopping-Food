using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Notifications.Queries;
using ShoppingFood.Application.Features.Notifications.Commands;
using Microsoft.AspNetCore.Authorization;

namespace ShoppingFood.API.Controllers
{
    public class NotificationController : CommonController
    {
        public NotificationController(IMediator mediator) : base(mediator)
        {
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var query = new GetNotificationsQuery();
            query.CurrentUserId = userDto?.Id;
            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var command = new MarkNotificationReadCommand { NotificationId = id };
            command.CurrentUserId = userDto?.Id;
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var command = new MarkAllNotificationsReadCommand();
            command.CurrentUserId = userDto?.Id;
            var response = await _mediator.Send(command);
            return Ok(response);
        }
    }
}
