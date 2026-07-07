using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Admin.Queries;
using ShoppingFood.Application.Features.Products.GlobalMenuCategories.Queries;
using ShoppingFood.Core.Base;
using System.Threading.Tasks;
using MediatR;

namespace ShoppingFood.API.Controllers
{
    [AllowAnonymous]
    [Route("api/[controller]")]
    public class SystemController : CommonController
    {
        public SystemController(IMediator mediator) : base(mediator)
        {
        }

        [HttpGet("legal")]
        public async Task<ActionResult<ApiResponse>> GetLegalSettings()
        {
            var result = await _mediator.Send(new GetLegalSettingsQuery());
            return StatusCode(result.Code, result);
        }

        [HttpGet("global-menu-category")]
        public async Task<ActionResult<ApiResponse>> GetGlobalMenuCategories()
        {
            var result = await _mediator.Send(new GetGlobalMenuCategoriesQuery { ShowHidden = false });
            return StatusCode(result.Code, result);
        }
    }
}
