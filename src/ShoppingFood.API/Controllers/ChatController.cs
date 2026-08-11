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

            if (!response.Error && response.Data != null)
            {
                var data = Newtonsoft.Json.Linq.JObject.FromObject(response.Data);
                var topicStr = data["topic"]?.ToString() ?? data["Topic"]?.ToString();
                var supportGroup = (topicStr == "SystemIssue" || topicStr == "General") 
                    ? "Support_Admin" 
                    : "Support_Coordinator";
                    
                await _hubContext.Clients.Group(supportGroup).SendAsync("NewSession", response.Data);
            }

            return StatusCode(response.Code, response);
        }

        [HttpPost("sessions/order/{orderId:guid}")]
        public async Task<ActionResult<ApiResponse>> CreateOrderSession(Guid orderId)
        {
            var command = new CreateOrderChatSessionCommand { OrderId = orderId };
            if (userDto != null)
                command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);

            if (!response.Error && response.Data != null)
            {
                var data = Newtonsoft.Json.Linq.JObject.FromObject(response.Data);
                var restaurantId = data["restaurantId"]?.ToString() ?? data["RestaurantId"]?.ToString();
                if (!string.IsNullOrEmpty(restaurantId))
                {
                    await _hubContext.Clients.Group($"seller_{restaurantId}")
                        .SendAsync("NewOrderChat", response.Data);
                }
            }

            return StatusCode(response.Code, response);
        }

        [HttpPost("sessions/restaurant/{restaurantId:guid}")]
        public async Task<ActionResult<ApiResponse>> CreateRestaurantSession(Guid restaurantId)
        {
            var command = new CreateRestaurantChatSessionCommand { RestaurantId = restaurantId };
            if (userDto != null)
                command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);

            if (!response.Error && response.Data != null)
            {
                await _hubContext.Clients.Group($"seller_{restaurantId}")
                    .SendAsync("NewOrderChat", response.Data);
            }

            return StatusCode(response.Code, response);
        }

        [HttpGet("sessions/seller/orders")]
        public async Task<ActionResult<ApiResponse>> GetSellerOrderChats()
        {
            var query = new GetSellerOrderChatsQuery();
            if (userDto != null)
                query.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpGet("sessions/customer")]
        public async Task<ActionResult<ApiResponse>> GetCustomerChats()
        {
            var query = new GetCustomerChatsQuery();
            if (userDto != null)
                query.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(query);
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

        [HttpGet("sessions/my")]
        public async Task<ActionResult<ApiResponse>> GetUserSessions()
        {
            var query = new GetUserSessionsQuery();
            if (userDto != null)
                query.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpGet("sessions/{sessionId}/messages")]
        public async Task<ActionResult<ApiResponse>> GetHistory(
            Guid sessionId,
            [FromQuery] int take = 20,
            [FromQuery] DateTime? before = null)
        {
            var query = new GetChatHistoryQuery
            {
                SessionId = sessionId,
                Take = take,
                Before = before
            };
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
