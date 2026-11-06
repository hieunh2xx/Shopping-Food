using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Campuses;

namespace ShoppingFood.API.Controllers
{
    public class CampusController : CommonController
    {
        public CampusController(IMediator mediator) : base(mediator)
        {
        }

        [HttpGet]
        public async Task<IActionResult> GetCampuses()
        {
            var response = await _mediator.Send(new GetCampusesQuery());
            return StatusCode(response.Code, response);
        }
    }

    [ApiController]
    [Route("api/Admin/campuses")]
    public class AdminCampusController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AdminCampusController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var response = await _mediator.Send(new GetCampusesQuery { IncludeInactive = true });
            return StatusCode(response.Code, response);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UpsertCampusCommand command)
        {
            command.Id = null;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpsertCampusCommand command)
        {
            command.Id = id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var response = await _mediator.Send(new DeleteCampusCommand { Id = id });
            return StatusCode(response.Code, response);
        }

        [HttpPost("{campusId}/buildings")]
        public async Task<IActionResult> CreateBuilding(Guid campusId, [FromBody] UpsertCampusBuildingCommand command)
        {
            command.Id = null;
            command.CampusId = campusId;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPut("buildings/{buildingId}")]
        public async Task<IActionResult> UpdateBuilding(Guid buildingId, [FromBody] UpsertCampusBuildingCommand command)
        {
            command.Id = buildingId;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpDelete("buildings/{buildingId}")]
        public async Task<IActionResult> DeleteBuilding(Guid buildingId)
        {
            var response = await _mediator.Send(new DeleteCampusBuildingCommand { Id = buildingId });
            return StatusCode(response.Code, response);
        }
    }
}
