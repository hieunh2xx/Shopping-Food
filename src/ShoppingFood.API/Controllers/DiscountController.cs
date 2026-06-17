using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Discounts.Commands;
using ShoppingFood.Core.Base;

namespace ShoppingFood.API.Controllers
{
    public class DiscountController : CommonController
    {
        public DiscountController(IMediator mediator) : base(mediator)
        {
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse>> Create([FromBody] CreateDiscountCommand command)
        {
            if(userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpPost("save")]
        public async Task<ActionResult<ApiResponse>> Save([FromBody] SaveDiscountCommand command)
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
