using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Coordinator.Queries;

namespace ShoppingFood.API.Controllers
{
    public class CoordinatorController : CommonController
    {
        public CoordinatorController(IMediator mediator) : base(mediator)
        {
        }

        [HttpGet("orders")]
        public async Task<ActionResult> GetDispatchBoardOrder([FromQuery] string? status, [FromQuery] int skip = 0, [FromQuery] int take = 50)
        {
            var query = new GetDispatchBoardQuery
            {
                Status = status,
                Skip = skip,
                Take = take
            };

            if(userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }

            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }
    }
}
