using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Admin.Commands;
using ShoppingFood.Application.Features.Products.GlobalMenuCategories.Commands;
using ShoppingFood.Application.Features.Products.GlobalMenuCategories.Queries;
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

        [HttpPost("approve-shipper-application")]
        public async Task<ActionResult<ApiResponse>> ApproveShipperApplication([FromBody] ApproveShipperApplicationCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpGet("GlobalMenuCategory")]
        public async Task<ActionResult<ApiResponse>> GetAll([FromQuery] bool showHidden = false)
        {
            var response = await _mediator.Send(new GetGlobalMenuCategoriesQuery { ShowHidden = showHidden });
            return Ok(response);
        }
        
        [HttpPost("GlobalMenuCategory")]
        public async Task<ActionResult<ApiResponse>> CreateGlobalMenuCategory([FromBody] AddGlobalMenuCategoryCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpPut("GlobalMenuCategory/{id}")]
        public async Task<ActionResult<ApiResponse>> UpdateGlobalMenuCategory(Guid id, [FromBody] UpdateGlobalMenuCategoryCommand command)
        {
            command.Id = id;
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpDelete("GlobalMenuCategory/{id}")]
        public async Task<ActionResult<ApiResponse>> DeleteGlobalMenuCategory(Guid id)
        {
            var response = await _mediator.Send(new DeleteGlobalMenuCategoryCommand { Id = id });
            return Ok(response);
        }

        [HttpPatch("GlobalMenuCategory/Visibility/{id}")]
        public async Task<ActionResult<ApiResponse>> ToggleGlobalMenuCategoryVisibility(Guid id)
        {
            var response = await _mediator.Send(new ToggleGlobalMenuCategoryVisibilityCommand { Id = id });
            return Ok(response);
        }
    }
}
