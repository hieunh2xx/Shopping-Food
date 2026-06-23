using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.LoyaltyPoints.Queries;
using ShoppingFood.Core.Base;

namespace ShoppingFood.API.Controllers
{
    public class LoyaltyPointController : CommonController
    {
        public LoyaltyPointController(IMediator mediator) : base(mediator)
        {
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse>> Get()
        {
            var query = new GetCustomerLoyaltyPointsQuery();
            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(query);
            return Ok(response);
        }
    }
}
