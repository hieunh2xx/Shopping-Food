using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Discounts.Commands;
using ShoppingFood.Application.Features.Discounts.Queries;
using ShoppingFood.Core.Base;

namespace ShoppingFood.API.Controllers
{
    public class DiscountController : CommonController
    {
        public DiscountController(IMediator mediator) : base(mediator)
        {
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse>> Get([FromQuery] GetDiscountQuery query)
        {
            var response = await _mediator.Send(query);
            return Ok(response);
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

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse>> GetById(Guid id)
        {
            var response = await _mediator.Send(new GetDiscountByIdQuery { Id = id });
            return Ok(response);
        }

        [HttpPost("{id}")]
        public async Task<ActionResult<ApiResponse>> Update(Guid id, [FromBody] UpdateDiscountCommand command)
        {
            command.Id = id;
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse>> Delete(Guid id)
        {
            var command = new DeleteDiscountCommand { Id = id };
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpPost("apply")]
        public async Task<ActionResult<ApiResponse>> Apply([FromBody] ApplyDiscountCommand command)
        {
            if(userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return Ok(response);
        }
    }
}
