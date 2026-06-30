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
    public class UserAddressController : CommonController
    {
        public UserAddressController(IMediator mediator) : base(mediator)
        {
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse>> GetAddresses()
        {
            if (userDto == null) return Unauthorized();
            var query = new GetUserAddressesQuery { CurrentUserId = userDto.Id };
            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse>> AddAddress([FromBody] AddUserAddressCommand command)
        {
            if (userDto == null) return Unauthorized();
            command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);
            if (response.Error) return BadRequest(response);
            return Ok(response);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse>> UpdateAddress(Guid id, [FromBody] UpdateUserAddressCommand command)
        {
            if (userDto == null) return Unauthorized();
            if (id != command.Id) return BadRequest(ApiResponse.Failure(400, "Mã địa chỉ không khớp."));
            command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);
            if (response.Error) return BadRequest(response);
            return Ok(response);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse>> DeleteAddress(Guid id)
        {
            if (userDto == null) return Unauthorized();
            var command = new DeleteUserAddressCommand { Id = id, CurrentUserId = userDto.Id };
            var response = await _mediator.Send(command);
            if (response.Error) return BadRequest(response);
            return Ok(response);
        }

        [HttpPut("{id}/SetDefault")]
        public async Task<ActionResult<ApiResponse>> SetDefault(Guid id)
        {
            if (userDto == null) return Unauthorized();
            var command = new SetDefaultAddressCommand { Id = id, CurrentUserId = userDto.Id };
            var response = await _mediator.Send(command);
            if (response.Error) return BadRequest(response);
            return Ok(response);
        }
    }
}
