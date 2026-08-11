using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Admin.Queries;
using ShoppingFood.Application.Features.Products.GlobalMenuCategories.Queries;
using ShoppingFood.Application.Features.System.Queries;
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

        /// <summary>
        /// Public delivery fee settings used by checkout (Platform Delivery).
        /// </summary>
        [HttpGet("delivery-settings")]
        public async Task<ActionResult<ApiResponse>> GetDeliverySettings()
        {
            var settings = await _mediator.Send(new GetDeliverySettingsQuery());
            return Ok(ApiResponse.Success(settings));
        }

        /// <summary>
        /// Public marketplace counters for the home hero (restaurants, customers, rating, delivery fees).
        /// </summary>
        [HttpGet("platform-stats")]
        public async Task<ActionResult<ApiResponse>> GetPlatformStats()
        {
            var result = await _mediator.Send(new GetPlatformStatsQuery());
            return StatusCode(result.Code, result);
        }

        [HttpGet("action-logs")]
        public async Task<ActionResult<ApiResponse>> GetActionLogs([FromQuery] GetSystemLogsQuery query)
        {
            var result = await _mediator.Send(query);
            return StatusCode(result.Code, result);
        }

        [HttpGet("error-logs")]
        public async Task<ActionResult<ApiResponse>> GetErrorLogs([FromQuery] GetSystemErrorLogsQuery query)
        {
            var result = await _mediator.Send(query);
            return StatusCode(result.Code, result);
        }
    }
}
