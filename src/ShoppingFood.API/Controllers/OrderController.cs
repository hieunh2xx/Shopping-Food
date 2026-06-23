using System.Security.Claims;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Orders.Commands;
using ShoppingFood.Application.Features.Orders.Queries;

namespace ShoppingFood.API.Controllers
{
    public class OrderController : CommonController
    {
        public OrderController(IMediator mediator) : base(mediator)
        {
        }

        [HttpGet("MyOrders")]
        public async Task<IActionResult> GetMyOrders([FromQuery] GetMyOrdersQuery query)
        {
            var username = userDto?.UserName;
            if (string.IsNullOrEmpty(username))
            {
                return Unauthorized();
            }

            query.Username = username;
            query.CurrentUserId = userDto.Id;

            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpGet("details/{id}")]
        public async Task<IActionResult> GetOrderDetails(Guid id)
        {
            var query = new GetOrderDetailQuery { OrderId = id };
            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutCommand command)
        {

            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("checkout/sent-otp")]
        public async Task<IActionResult> SendCheckoutOtp([FromBody]  SendCheckoutOtpCommand command)
        {
            var respone = await _mediator.Send(command);
            return StatusCode(respone.Code, respone);
        }
        [HttpPut("update")]
        public async Task<IActionResult> UpdateOrder([FromBody] UpdateOrderCommand command)
        {
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPut("cancel")]
        public async Task<IActionResult> CancelOrder([FromBody] CancelOrderCommand command)
        {
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("reorder")]
        public async Task<IActionResult> Reorder([FromBody] ReorderCommand command)
        {
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("accept")]
        public async Task<IActionResult> AcceptOrder([FromBody] AcceptOrderCommand command)
        {
            if(userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("reject")]
        public async Task<IActionResult> RejectOrder([FromBody] RejectOrderCommand command)
        {
            if(userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("prepare")]
        public async Task<IActionResult> PrepareOrder([FromBody]  PrepareOrderCommand command)
        {
            if(userDto != null)
            {
                command.CurrentUserId= userDto.Id;
            }
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("waiting-for-shipper")]
        public async Task<IActionResult> WaitingForShipperOrder([FromBody] WaitingShipperOrderCommand command)
        {
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }
        [HttpPost("seller-cancel")]
        public async Task<IActionResult> SellerCancelOrder([FromBody]  SellerCancelOrderCommand command)
        {
            if(userDto!= null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var respone = await _mediator.Send(command);
            return StatusCode(respone.Code, respone);
        }
    }
}
