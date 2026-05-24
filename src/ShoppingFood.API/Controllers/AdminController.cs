using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Admin;
using ShoppingFood.Core.Base;

namespace ShoppingFood.API.Controllers
{
    public class AdminController : CommonController
    {
        public AdminController(IMediator mediator) : base(mediator) 
        {
        }

        [HttpPost("ApproveSellerApplication")]
        public async Task<ActionResult<ApiResponse>> ApproveSellerApplication([FromBody] ApproveApplicationCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpPost("ApproveProduct")]
        public async Task<ActionResult<ApiResponse>> ApproveProduct([FromBody] ApproveProductCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }
    }
}
