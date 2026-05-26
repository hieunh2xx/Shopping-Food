using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Products.Toppings.Commands;
using ShoppingFood.Application.Features.Products.Toppings.Queries;
using ShoppingFood.Core.Base;
using System;
using System.Threading.Tasks;

namespace ShoppingFood.API.Controllers
{
    public class ToppingController : CommonController
    {
        public ToppingController(IMediator mediator) : base(mediator)
        {
        }

        [HttpGet("restaurant/{restaurantId}")]
        public async Task<ActionResult<ApiResponse>> GetByRestaurantId(Guid restaurantId)
        {
            var response = await _mediator.Send(new GetRestaurantToppingsQuery(restaurantId));
            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse>> Create([FromBody] CreateToppingCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse>> Update(Guid id, [FromBody] UpdateToppingCommand command)
        {
            command.Id = id;
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse>> Delete(Guid id)
        {
            var response = await _mediator.Send(new DeleteToppingQuery(id));
            return Ok(response);
        }
    }
}
