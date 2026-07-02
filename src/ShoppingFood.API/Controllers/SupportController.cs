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

        [HttpPost("order-complaint")]
        public async Task<ActionResult<ApiResponse>> SubmitOrderComplaint([FromBody] SubmitOrderComplaintCommand command)
        {
            if (userDto != null)
                command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("shipper-complaint")]
        public async Task<ActionResult<ApiResponse>> SubmitShipperComplaint([FromBody] SubmitShipperComplaintCommand command)
        {
            if (userDto != null)
                command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }
    }
}
