using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Faqs.Commands;
using ShoppingFood.Application.Features.Faqs.Queries;
using ShoppingFood.Core.Base;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace ShoppingFood.API.Controllers
{
    public class FaqController : CommonController
    {
        public FaqController(IMediator mediator) : base(mediator)
        {
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse>> GetFaqs([FromQuery] GetFaqsQuery query)
        {
            if (userDto != null)
                query.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse>> GetFaqDetail(Guid id, [FromQuery] GetFaqDetailQuery query)
        {
            query.Id = id;
            if (userDto != null)
                query.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse>> Create([FromBody] CreateFaqCommand command)
        {
            if (userDto != null)
                command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse>> Update(Guid id, [FromBody] UpdateFaqCommand command)
        {
            command.Id = id;
            if (userDto != null)
                command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse>> Delete(Guid id)
        {
            var command = new DeleteFaqCommand { Id = id };
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }
    }
}
