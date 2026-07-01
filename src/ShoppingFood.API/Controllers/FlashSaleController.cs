using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.FlashSales.Commands;
using ShoppingFood.Application.Features.FlashSales.Queries;
using ShoppingFood.Core.Base;
using System.Threading.Tasks;

namespace ShoppingFood.API.Controllers
{
    public class FlashSaleController : CommonController
    {
        public FlashSaleController(IMediator mediator) : base(mediator) { }

        [HttpGet("active")]
        public async Task<ActionResult<ApiResponse>> GetActiveFlashSales([FromQuery] GetActiveFlashSaleQuery query)
        {
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpGet("flash-sales")]
        public async Task<ActionResult<ApiResponse>> GetFlashSales([FromQuery] GetFlashSalesQuery query)
        {
            if (userDto != null)
                query.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpPost("flash-sales")]
        public async Task<ActionResult<ApiResponse>> CreateFlashSale([FromBody] CreateFlashSaleCommand command)
        {
            if (userDto != null)
                command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("flash-sales/{id}")]
        public async Task<ActionResult<ApiResponse>> UpdateFlashSale(Guid id, [FromBody] UpdateFlashSaleCommand command)
        {
            command.Id = id;
            if (userDto != null)
                command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpDelete("flash-sales/{id}")]
        public async Task<ActionResult<ApiResponse>> DeleteFlashSale(Guid id)
        {
            var command = new DeleteFlashSaleCommand { Id = id };
            if (userDto != null)
                command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        /// <summary>
        /// Seller đăng ký sản phẩm tham gia flash sale
        /// </summary>
        /// <param name="command"></param>
        /// <returns></returns>
        [HttpPost("register")]
        public async Task<ActionResult<ApiResponse>> RegisterFlashSale([FromBody] RegisterFlashSaleCommand command)
        {
            if (userDto != null)
                command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpGet("flash-sales/{id}/products")]
        public async Task<ActionResult<ApiResponse>> GetFlashSaleProducts(Guid id, [FromQuery] GetFlashSaleProductsQuery query)
        {
            query.FlashSaleId = id;
            if (userDto != null)
                query.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpPost("review-product")]
        public async Task<ActionResult<ApiResponse>> ReviewFlashSaleProduct([FromBody] ReviewFlashSaleProductCommand command)
        {
            if (userDto != null)
                command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }
    }
}
