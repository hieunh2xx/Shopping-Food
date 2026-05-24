using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Products.Menu.Commands;
using ShoppingFood.Core.Base;
using System.Threading.Tasks;

namespace ShoppingFood.API.Controllers
{
    public class MenuCategoryController : CommonController
    {
        public MenuCategoryController(IMediator mediator) : base(mediator)
        {
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
