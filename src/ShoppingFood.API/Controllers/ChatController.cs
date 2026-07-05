using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using ShoppingFood.API.Hubs;
using ShoppingFood.Application.Features.Chat.Commands;
using ShoppingFood.Application.Features.Chat.Queries;
using ShoppingFood.Core.Base;

namespace ShoppingFood.API.Controllers
{
    public class ChatController : CommonController
    {
        private readonly IHubContext<ChatHub> _hubContext;

        public ChatController(IMediator mediator, IHubContext<ChatHub> hubContext) : base(mediator)
        {
            _hubContext = hubContext;
        }

        [HttpPost("sessions")]
        public async Task<ActionResult<ApiResponse>> CreateSession([FromBody] CreateChatSessionCommand command)
        {
            if (userDto != null)
                command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);

            // Broadcast new session to Support group if successful
            if (!response.Error && response.Data != null)
            {
                await _hubContext.Clients.Group("Support").SendAsync("NewSession", response.Data);
            }

            return StatusCode(response.Code, response);
        }
        [HttpGet("sessions")]
        public async Task<ActionResult<ApiResponse>> GetOpenSessions()
        {
            var query = new GetOpenSessionsQuery();
            if (userDto != null)
                query.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpGet("sessions/current")]
        public async Task<ActionResult<ApiResponse>> GetCurrentSession()
        {
            var query = new GetCurrentSessionQuery();
            if (userDto != null)
                query.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpGet("sessions/{sessionId}/messages")]
        public async Task<ActionResult<ApiResponse>> GetHistory(Guid sessionId)
        {
            var query = new GetChatHistoryQuery { SessionId = sessionId };
            if (userDto != null)
                query.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpPost("sessions/{sessionId}/claim")]
        public async Task<ActionResult<ApiResponse>> ClaimSession(Guid sessionId, [FromBody] ClaimChatSessionCommand command)
        {
            command.SessionId = sessionId;
            if (userDto != null)
                command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }
    }
}
