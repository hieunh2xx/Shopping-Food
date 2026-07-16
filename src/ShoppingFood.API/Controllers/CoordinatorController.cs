using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Coordinator.Commands;
using ShoppingFood.Application.Features.Coordinator.Queries;
using ShoppingFood.Core.Base;

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

        [HttpPost("orders/{orderId}/broadcast")]
        public async Task<IActionResult> BroadcastOrder(Guid orderId)
        {
            var command = new BroadcastOrderToNearbyShippersCommand { OrderId = orderId };
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }

            var response = await _mediator.Send(command);
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

        [HttpPost("shippers/{shipperId}/adjust-reputation")]
        public async Task<IActionResult> AdjustShipperReputation(Guid shipperId, [FromBody] AdjustShipperReputationCommand command)
        {
            command.ShipperId = shipperId;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpGet("orders/{orderId}/dispatch-history")]
        public async Task<IActionResult> GetDispatchHistory(Guid orderId)
        {
            var query = new GetOrderDispatchHistoryQuery { OrderId = orderId };
            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }

            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpGet("orders/dispatch-history")]
        public async Task<IActionResult> GetAllDispatchHistories(
            [FromQuery] Guid? orderId, 
            [FromQuery] string? actionType, 
            [FromQuery] string? filter,
            [FromQuery] int skip = 0, 
            [FromQuery] int take = 10)
        {
            var query = new GetAllDispatchHistoryQuery
            {
                OrderId = orderId,
                ActionType = actionType,
                Filter = filter,
                Skip = skip,
                Take = take
            };

            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }

            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpGet("incidents")]
        public async Task<ActionResult<ApiResponse>> GetIncidents([FromQuery] GetIncidentsQuery query)
        {
            if (userDto != null)
                query.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpPost("complaint/{reportId}/resolve")]
        public async Task<ActionResult<ApiResponse>> ResolveComplaint(Guid reportId, [FromBody] ResolveComplaintCommand command)
        {
            command.ReportId = reportId;
            if (userDto != null)
                command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpGet("complaints/orders")]
        public async Task<ActionResult<ApiResponse>> GetOrderComplaints([FromQuery] string? status, [FromQuery] int skip = 0, [FromQuery] int take = 20)
        {
            var query = new GetOrderComplaintsQuery { Status = status, Skip = skip, Take = take };
            if (userDto != null)
                query.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }
    }
}

