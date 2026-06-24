using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.LoyaltyPoints.Commands;
using ShoppingFood.Application.Features.LoyaltyPoints.Queries;
using ShoppingFood.Core.Base;

namespace ShoppingFood.API.Controllers
{
    public class LoyaltyPointController : CommonController
    {
        public LoyaltyPointController(IMediator mediator) : base(mediator)
        {
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse>> Get()
        {
            var query = new GetCustomerLoyaltyPointsQuery();
            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpGet("gifts")]
        public async Task<ActionResult<ApiResponse>> GetActiveGifts()
        {
            var query = new GetPointGiftConfigsQuery { IsActiveOnly = true };
            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpPost("redeem")]
        public async Task<ActionResult<ApiResponse>> Redeem([FromBody] RedeemPointGiftCommand command)
        {
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return Ok(response);
        }
    }
}
