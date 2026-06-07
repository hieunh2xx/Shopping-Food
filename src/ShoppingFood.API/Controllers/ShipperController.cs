using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Core.Base;
using ShoppingFood.Application.Features.Users.Commands;
using System.Threading.Tasks;

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
            return Ok(response);
        }
    }
}
