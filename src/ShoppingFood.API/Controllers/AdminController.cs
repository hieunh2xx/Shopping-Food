using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Admin.Commands;
using ShoppingFood.Application.Features.Admin.Queries;
using ShoppingFood.Application.Features.LoyaltyPoints.Commands;
using ShoppingFood.Application.Features.LoyaltyPoints.Queries;
using ShoppingFood.Application.Features.Products.GlobalMenuCategories.Commands;
using ShoppingFood.Application.Features.Products.GlobalMenuCategories.Queries;
using ShoppingFood.Core.Base;
using System;
using System.Threading.Tasks;

namespace ShoppingFood.API.Controllers
{
    public class AdminController : CommonController
    {
        public AdminController(IMediator mediator) : base(mediator) 
        {
        }

        [HttpGet("SellerApplications")]
        public async Task<ActionResult<ApiResponse>> GetSellerApplications([FromQuery] GetSellerApplicationsQuery query)
        {
            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpGet("Restaurants")]
        public async Task<ActionResult<ApiResponse>> GetRestaurants([FromQuery] GetRestaurantsQuery query)
        {
            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpGet("ShipperApplications")]
        public async Task<ActionResult<ApiResponse>> GetShipperApplications([FromQuery] GetShipperApplicationsQuery query)
        {
            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(query);
            return Ok(response);
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

        [HttpGet("point-gift-config")]
        public async Task<ActionResult<ApiResponse>> GetPointGiftConfig([FromQuery] bool? isActiveOnly)
        {
            var response = await _mediator.Send(new GetPointGiftConfigsQuery { IsActiveOnly = isActiveOnly });
            return Ok(response);
        }

        [HttpPost("point-gift-config")]
        public async Task<ActionResult<ApiResponse>> CreatePointGiftConfig([FromBody] CreatePointGiftConfigCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpPut("point-gift-config/{id}")]
        public async Task<ActionResult<ApiResponse>> UpdatePointGiftConfig(Guid id, [FromBody] UpdatePointGiftConfigCommand command)
        {
            command.Id = id;
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpDelete("PointGiftConfig/{id}")]
        public async Task<ActionResult<ApiResponse>> DeletePointGiftConfig(Guid id)
        {
            var command = new DeletePointGiftConfigCommand { Id = id };
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpPut("suspend-restaurant")]
        public async Task<ActionResult<ApiResponse>> SuspendRestaurant([FromBody] SuspendRestaurantCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }
    }
}
