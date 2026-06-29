using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Support.Commands;
using ShoppingFood.Core.Base;
using System.Threading.Tasks;

namespace ShoppingFood.API.Controllers
{
    
    public class SupportController : CommonController
    {
        public SupportController(IMediator mediator) : base(mediator)
        {
        }

        [HttpPost("appeal")]
        public async Task<ActionResult<ApiResponse>> SubmitAppeal([FromBody] SubmitAppealCommand command)
        {
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }
    }
}
