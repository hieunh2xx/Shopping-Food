using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Restaurants.Commands;
using ShoppingFood.Application.Features.Restaurants.Queries;
using ShoppingFood.Core.Base;

namespace ShoppingFood.API.Controllers
{
    public class RestaurantController : CommonController
    {
        public RestaurantController(IMediator mediator) : base(mediator)
        {
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse>> GetDetail(Guid id)
        {
            var respone = await _mediator.Send(new GetRestaurantDetailQuery(id));
            return Ok(respone);
        }

        [HttpGet("DashboardStats")]
        public async Task<ActionResult<ApiResponse>> GetDashboardStats([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var query = new GetRestaurantDashboardStatsQuery
            {
                StartDate = startDate,
                EndDate = endDate
            };
            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpGet("Favorites")]
        public async Task<ActionResult<ApiResponse>> GetFavorites([FromQuery] GetFavoriteRestaurantsQuery query)
        {
            
            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpPost("{id}/Favorite")]
        public async Task<ActionResult<ApiResponse>> ToggleFavorite(Guid id, ToggleFavoriteRestaurantCommand command)
        {
            command.RestaurantId = id;
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpPut("basic-info")]
        public async Task<ActionResult<ApiResponse>> UpdateBasicInfo([FromBody] UpdateRestaurantBasicInfoCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }
        
        [HttpPut("operating-hours")]
        public async Task<ActionResult<ApiResponse>> UpdateOperatingHours([FromBody] UpdateRestaurantOperatingHoursCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpPut("status")]
        public async Task<ActionResult<ApiResponse>> UpdateStatus([FromBody] UpdateRestaurantStatusCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpPut("delivery-radius")]
        public async Task<ActionResult<ApiResponse>> UpdateDeliveryRadius([FromBody] UpdateRestaurantDeliveryRadiusCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpPut("shipping-fee")]
        public async Task<ActionResult<ApiResponse>> UpdateShippingFee([FromBody] UpdateRestaurantShippingFeeCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }
    }
}
