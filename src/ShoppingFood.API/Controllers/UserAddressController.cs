using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.UserAddresses.Commands;
using ShoppingFood.Application.Features.UserAddresses.Queries;
using ShoppingFood.Core.Base;

namespace ShoppingFood.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserAddressController : ControllerBase
    {
        private readonly IMediator _mediator;

        public UserAddressController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse>> GetAddresses()
        {
            var response = await _mediator.Send(new GetUserAddressesQuery());
            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse>> AddAddress([FromBody] AddUserAddressCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.Error) return BadRequest(response);
            return Ok(response);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse>> UpdateAddress(Guid id, [FromBody] UpdateUserAddressCommand command)
        {
            if (id != command.Id) return BadRequest(ApiResponse.Failure(400, "Mã địa chỉ không khớp."));
            var response = await _mediator.Send(command);
            if (response.Error) return BadRequest(response);
            return Ok(response);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse>> DeleteAddress(Guid id)
        {
            var response = await _mediator.Send(new DeleteUserAddressCommand { Id = id });
            if (response.Error) return BadRequest(response);
            return Ok(response);
        }

        [HttpPut("{id}/SetDefault")]
        public async Task<ActionResult<ApiResponse>> SetDefault(Guid id)
        {
            var response = await _mediator.Send(new SetDefaultAddressCommand { Id = id });
            if (response.Error) return BadRequest(response);
            return Ok(response);
        }
    }
}
