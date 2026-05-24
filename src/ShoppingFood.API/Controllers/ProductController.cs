using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Products.Queries;
using ShoppingFood.Application.Features.Products.Commands;
using ShoppingFood.Core.Base;

namespace ShoppingFood.API.Controllers
{
    public class ProductController : CommonController
    {
        public ProductController(IMediator mediator) : base(mediator)
        {
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse>> Create([FromBody] AddProductCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse>> Update(Guid id, [FromBody] UpdateProductCommand command)
        {
            
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse>> Delete(Guid id)
        {
            var response = await _mediator.Send(new DeleteProductQuery(id));
            return Ok(response);
        }
        [HttpPatch("StockStatus/{id}")]
        public async Task<ActionResult<ApiResponse>> UpdateStockStatus(Guid id, [FromBody] UpdateProductStockCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }
        [HttpPatch("Visibility/{id}")]
        public async Task<ActionResult<ApiResponse>> UpdateVisibility(Guid id, [FromBody] ToggleProductVisibilityCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }
        [HttpGet]
        public async Task<ActionResult<ApiResponse>> Get([FromQuery] GetProductsQuery query)
        {
            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse>> GetById(Guid id)
        {
            var response = await _mediator.Send(new GetProductDetailQuery(id));
            return Ok(response);
        }

        [HttpGet("Search")]
        public async Task<ActionResult<ApiResponse>> Search([FromQuery] SearchProductQuery query)
        {
            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpGet("BestSellers")]
        public async Task<ActionResult<ApiResponse>> BestSellers([FromQuery] int take = 10)
        {
            var response = await _mediator.Send(new GetBestSellersQuery { Take = take });
            return Ok(response);
        }

        [HttpGet("Categories")]
        public async Task<ActionResult<ApiResponse>> Categories()
        {
            var response = await _mediator.Send(new GetCategoriesQuery());
            return Ok(response);
        }
        
        [HttpPatch("TimeAvailability/{id}")]
        public async Task<ActionResult<ApiResponse>> UpdateAvailability(Guid id, [FromBody] UpdateProductAvailabilityCommand command)
        {
            command.Id = id;
            var response = await _mediator.Send(command);
            return Ok(response);
        }
    }
}
