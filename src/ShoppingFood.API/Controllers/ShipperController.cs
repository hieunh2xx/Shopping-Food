using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Core.Base;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Application.Features.Shippers.Commands;
using ShoppingFood.Application.Features.Shippers.Queries;
using System.Threading.Tasks;
using ShoppingFood.Application.Features.Orders.Commands;
using ShoppingFood.Application.Features.Orders.Queries;
using ShoppingFood.Application.Features.Coordinator.Queries;
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
            return StatusCode(response.Code, response);
        }
        [HttpGet("proposed-offer/{orderId}")]
        public async Task<ActionResult<ApiResponse>> GetProposedOffer(Guid orderId, [FromQuery] double latitude, [FromQuery] double longitude)
        {
            var query = new GetProposedDeliveryOfferQuery { OrderId = orderId, Latitude = latitude, Longitude = longitude };
            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpPost("accept-offer")]
        public async Task<ActionResult<ApiResponse>> AcceptOffer([FromBody] AcceptDeliveryOfferCommand command)
        {
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
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

        [HttpPost("location")]
        public async Task<ActionResult<ApiResponse>> UpdateLocation([FromBody] UpdateShipperLocationCommand command)
        {
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpGet("delivery-route/{orderId}")]
        public async Task<ActionResult<ApiResponse>> GetDeliveryRoute(Guid orderId)
        {
            var query = new GetDeliveryRouteQuery { OrderId = orderId };
            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpPost("confirm-delivered")]
        public async Task<ActionResult<ApiResponse>> ConfirmDelivered([FromBody] ConfirmDeliverySuccessCommand command)
        {
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("confirm-failed")]
        public async Task<ActionResult<ApiResponse>> ConfirmFailed([FromBody] ConfirmDeliveryFailedCommand command)
        {
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpGet("income-report")]
        public async Task<ActionResult<ApiResponse>> GetIncomeReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var query = new GetShipperIncomeReportQuery
            {
                StartDate = startDate,
                EndDate = endDate
            };
            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpGet("schedule-area")]
        public async Task<ActionResult<ApiResponse>> GetScheduleAndArea()
        {
            var query = new GetShipperScheduleAndAreaQuery();
            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpPut("schedule-area")]
        public async Task<ActionResult<ApiResponse>> UpdateScheduleAndArea([FromBody] UpdateShipperScheduleAndAreaCommand command)
        {
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpGet("available-offers")]
        public async Task<ActionResult<ApiResponse>> GetAvailableOffers([FromQuery] double latitude, [FromQuery] double longitude)
        {
            var query = new GetAvailableOrdersForShipperQuery
            {
                Latitude = latitude,
                Longitude = longitude
            };
            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpPost("reject-offer")]
        public async Task<ActionResult<ApiResponse>> RejectOffer([FromBody] RejectDeliveryOfferCommand command)
        {
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("review")]
        public async Task<ActionResult<ApiResponse>> ReviewShipper([FromBody] CreateShipperReviewCommand command)
        {
            if (userDto != null)
                command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpGet("ReputationHistory")]
        public async Task<ActionResult<ApiResponse>> GetReputationHistory()
        {
            var query = new GetReputationHistoryQuery();
            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpPost("Orders/{orderId}/report")]
        public async Task<ActionResult<ApiResponse>> ReportOrderIncident(Guid orderId, [FromBody] ReportOrderIncidentCommand command)
        {
            command.OrderId = orderId;
            if (userDto != null)
                command.CurrentUserId = userDto.Id;
            
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("orders/{orderId}/explanation")]
        public async Task<ActionResult<ApiResponse>> SubmitExplanation(Guid orderId, [FromBody] SubmitOrderExplanationCommand command)
        {
            command.OrderId = orderId;
            if (userDto != null)
                command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpGet("orders/{orderId}/explanation")]
        public async Task<ActionResult<ApiResponse>> GetExplanation(Guid orderId)
        {
            var query = new GetOrderExplanationQuery { OrderId = orderId };
            if (userDto != null)
                query.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }
    }
}
