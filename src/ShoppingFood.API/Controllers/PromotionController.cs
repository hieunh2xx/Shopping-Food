using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Promotions.Commands;
using ShoppingFood.Application.Features.Promotions.Queries;
using ShoppingFood.Core.Base;

namespace ShoppingFood.API.Controllers
{
    public class PromotionController : CommonController
    {
        public PromotionController(IMediator mediator) : base(mediator)
        {
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse>> Get([FromQuery] GetPromotionsQuery query)
        {
            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(query);
            return Ok(response);
        }
        [HttpPost]
        public async Task<ActionResult<ApiResponse>> Create([FromBody] CreatePromotionCommand command)
        {
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return Ok(response);
        }
        [HttpPost("{id}")]
        public async Task<ActionResult<ApiResponse>> Update(Guid id, [FromBody] UpdatePromotionCommand command)
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
            var command = new DeletePromotionCommand(id);
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return Ok(response);
        }
    }
}
