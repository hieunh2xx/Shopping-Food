using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Coordinator.Commands;
using ShoppingFood.Application.Features.Coordinator.Queries;

namespace ShoppingFood.API.Controllers
{
    public class CoordinatorController : CommonController
    {
        public CoordinatorController(IMediator mediator) : base(mediator)
        {
        }

        [HttpGet("orders")]
        public async Task<ActionResult> GetDispatchBoardOrder([FromQuery] string? status, [FromQuery] int skip = 0, [FromQuery] int take = 50, [FromQuery] bool? isEscalated = null)
        {
            var query = new GetDispatchBoardQuery
            {
                Status = status,
                Skip = skip,
                Take = take,
                IsEscalated = isEscalated
            };

            if(userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }

            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpGet("orders/{orderId}/suggested-shippers")]
        public async Task<ActionResult> GetSuggestedShippers(Guid orderId)
        {
            var query = new GetSuggestedShippersQuery
            {
                OrderId = orderId
            };

            if(userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }

            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpPost("proposals")]
        public async Task<IActionResult> SendProposal([FromBody] SendProposalCommand command)
        {
            if(userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }

            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("orders/force-assign")]
        public async Task<IActionResult> ForceAssign([FromBody] ForceAssignCommand command)
        {
            if(userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }

            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("orders/{orderId}/resolve-incident")]
        public async Task<IActionResult> ResolveIncident(Guid orderId, [FromBody] ResolveIncidentCommand command)
        {
            command.OrderId = orderId;
            if(userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("orders/{orderId}/release")]
        public async Task<IActionResult> ReleaseOrder(Guid orderId, [FromBody]  ReleaseOrderCommand command)
        {
            command.OrderId = orderId;
            if(userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }

            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpGet("shippers/monitoring")]
        public async Task<IActionResult> GetMonitorShippers([FromQuery] bool? isOnline, [FromQuery] string? searchName)
        {
            var query = new GetMonitorShipperQuery
            {
                IsOnline = isOnline,
                SearchName = searchName
            };

            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }

            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpPost("shippers/{shipperId}/suspend")]
        public async Task<IActionResult> SuspendShipper(Guid shipperId, [FromBody] SuspendShipperCommand command)
        {
            command.ShipperId = shipperId;
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }

            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }


    }
}

