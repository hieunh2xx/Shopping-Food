using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Carts.Commands;
using ShoppingFood.Application.Features.Carts.Queries;

namespace ShoppingFood.API.Controllers
{
    public class CartController : CommonController
    {
        public CartController(IMediator mediator) : base(mediator)
        {
        }

        [HttpPost]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpGet]
        public async Task<IActionResult> GetCart([FromQuery] GetCartQuery query)
        {
            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateQuantity([FromBody] UpdateCartItemQuantityCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpDelete]
        public async Task<IActionResult> RemoveCartItem([FromQuery] RemoveCartItemCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart([FromQuery] ClearCartCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }
    }
}
