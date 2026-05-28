using System.Security.Claims;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Orders.Queries;

namespace ShoppingFood.API.Controllers
{
    public class OrderController : CommonController
    {
        public OrderController(IMediator mediator) : base(mediator)
        {
        }

        [HttpGet("MyOrders")]
        public async Task<IActionResult> GetMyOrders()
        {
            var username = userDto?.UserName;
            if (string.IsNullOrEmpty(username))
            {
                return Unauthorized();
            }

            var query = new GetMyOrdersQuery { Username = username };
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }
    }
}
