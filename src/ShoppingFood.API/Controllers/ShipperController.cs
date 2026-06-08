using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Core.Base;
using ShoppingFood.Application.Features.Users.Commands;
using System.Threading.Tasks;
using ShoppingFood.Application.Features.Orders.Commands;
using ShoppingFood.Application.Features.Orders.Queries;
using System;

namespace ShoppingFood.API.Controllers
{
    public class ShipperController : CommonController
    {
        public ShipperController(IMediator mediator) : base(mediator)
        {
        }

        [HttpPost("toggle-online")]
        public async Task<ActionResult<ApiResponse>> ToggleOnline([FromBody] ToggleShipperOnlineCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }
        [HttpGet("proposed-offer/{orderId}")]
        public async Task<ActionResult<ApiResponse>> GetProposedOffer(Guid orderId)
        {
            var query = new GetProposedDeliveryOfferQuery { OrderId = orderId };
            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpPost("accept-offer")]
        public async Task<ActionResult<ApiResponse>> AcceptOffer([FromBody] AcceptDeliverOfferCommand command)
        {
            var respone = await _mediator.Send(command);
            return Ok(respone);
        }

        [HttpPost("confirm-arrived")]
        public async Task<ActionResult<ApiResponse>> ConfirmArrived([FromBody] ConfirmArrivedAtRestaurantCommand command)
        {
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("confirm-picked-up")]
        public async Task<ActionResult<ApiResponse>> ConfirmPickedUp([FromBody] ConfirmPickedUpCommand command)
        {
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

    }
}
