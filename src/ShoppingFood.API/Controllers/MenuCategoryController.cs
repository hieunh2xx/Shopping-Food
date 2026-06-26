using System;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Products.Menu.Commands;
using ShoppingFood.Application.Features.Products.MenuCategories.Queries;
using ShoppingFood.Core.Base;
using System.Threading.Tasks;

namespace ShoppingFood.API.Controllers
{
    public class MenuCategoryController : CommonController
    {
        public MenuCategoryController(IMediator mediator) : base(mediator)
        {
        }

        [HttpGet("{restaurantId}")]
        public async Task<ActionResult<ApiResponse>> GetByRestaurant(Guid restaurantId)
        {
            var response = await _mediator.Send(new GetMenuCategoriesQuery { RestaurantId = restaurantId });
            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse>> Create([FromBody] AddMenuCategoryCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpPut]
        public async Task<ActionResult<ApiResponse>> Update([FromBody] UpdateMenuCategoryCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        
    }
}
