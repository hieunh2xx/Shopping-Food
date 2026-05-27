using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Restaurants.Commands;
using ShoppingFood.Application.Restaurants.Queries;
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
    }
}
