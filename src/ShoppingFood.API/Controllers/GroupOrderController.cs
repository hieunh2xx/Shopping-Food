using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.GroupOrders;

namespace ShoppingFood.API.Controllers
{
    public class GroupOrderController : CommonController
    {
        public GroupOrderController(IMediator mediator) : base(mediator)
        {
        }

        [HttpGet]
        public async Task<IActionResult> GetOpen([FromQuery] Guid? campusId, [FromQuery] Guid? buildingId, [FromQuery] Guid? restaurantId, [FromQuery] int take = 30)
        {
            var response = await _mediator.Send(new GetOpenGroupOrdersQuery
            {
                CurrentUserId = userDto?.Id,
                CampusId = campusId,
                BuildingId = buildingId,
                RestaurantId = restaurantId,
                Take = take
            });
            return StatusCode(response.Code, response);
        }

        [HttpGet("mine")]
        public async Task<IActionResult> GetMine()
        {
            var response = await _mediator.Send(new GetMyGroupOrdersQuery { CurrentUserId = userDto?.Id });
            return StatusCode(response.Code, response);
        }

        [HttpGet("restaurants")]
        public async Task<IActionResult> GetRestaurants([FromQuery] Guid campusId)
        {
            var response = await _mediator.Send(new GetGroupOrderRestaurantsQuery { CampusId = campusId });
            return StatusCode(response.Code, response);
        }

        [HttpGet("menu/{restaurantId}")]
        public async Task<IActionResult> GetMenu(Guid restaurantId)
        {
            var response = await _mediator.Send(new GetGroupOrderMenuQuery { RestaurantId = restaurantId });
            return StatusCode(response.Code, response);
        }

        /// <summary>Đơn gom theo danh sách mã Order (nhà hàng / shipper / điều phối).</summary>
        [HttpGet("for-orders")]
        public async Task<IActionResult> GetForOrders([FromQuery] string? orderIds)
        {
            var ids = (orderIds ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => Guid.TryParse(s, out var g) ? g : Guid.Empty)
                .Where(g => g != Guid.Empty)
                .ToList();
            var response = await _mediator.Send(new GetGroupOrdersForOrdersQuery { CurrentUserId = userDto?.Id, OrderIds = ids });
            return StatusCode(response.Code, response);
        }

        [HttpPost("{id:guid}/members/{memberId:guid}/delivered")]
        public async Task<IActionResult> MarkPortionDelivered(Guid id, Guid memberId, [FromQuery] bool delivered = true)
            => await Send(new MarkGroupPortionDeliveredCommand { GroupOrderId = id, MemberId = memberId, Delivered = delivered });

        [HttpGet("code/{code}")]
        public async Task<IActionResult> GetByCode(string code)
        {
            var response = await _mediator.Send(new GetGroupOrderDetailQuery { Code = code, CurrentUserId = userDto?.Id });
            return StatusCode(response.Code, response);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetDetail(Guid id)
        {
            var response = await _mediator.Send(new GetGroupOrderDetailQuery { Id = id, CurrentUserId = userDto?.Id });
            return StatusCode(response.Code, response);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateGroupOrderCommand command)
            => await Send(command);

        [HttpPost("{id:guid}/join")]
        public async Task<IActionResult> Join(Guid id, [FromBody] JoinGroupOrderCommand command)
        {
            command.GroupOrderId = id;
            return await Send(command);
        }

        [HttpPut("{id:guid}/me")]
        public async Task<IActionResult> UpdateMe(Guid id, [FromBody] UpdateGroupOrderMembershipCommand command)
        {
            command.GroupOrderId = id;
            return await Send(command);
        }

        [HttpPost("{id:guid}/items")]
        public async Task<IActionResult> AddItem(Guid id, [FromBody] AddGroupOrderItemCommand command)
        {
            command.GroupOrderId = id;
            return await Send(command);
        }

        [HttpPut("{id:guid}/items/{itemId:guid}")]
        public async Task<IActionResult> UpdateItem(Guid id, Guid itemId, [FromBody] UpdateGroupOrderItemCommand command)
        {
            command.GroupOrderId = id;
            command.ItemId = itemId;
            return await Send(command);
        }

        [HttpDelete("{id:guid}/items/{itemId:guid}")]
        public async Task<IActionResult> RemoveItem(Guid id, Guid itemId)
            => await Send(new UpdateGroupOrderItemCommand { GroupOrderId = id, ItemId = itemId, Quantity = 0 });

        [HttpPost("{id:guid}/pay")]
        public async Task<IActionResult> Pay(Guid id, [FromBody] PayGroupOrderCommand command)
        {
            command.GroupOrderId = id;
            return await Send(command);
        }

        [HttpPost("{id:guid}/unpay")]
        public async Task<IActionResult> Unpay(Guid id, [FromBody] UnpayGroupOrderCommand command)
        {
            command.GroupOrderId = id;
            return await Send(command);
        }

        [HttpPost("{id:guid}/leave")]
        public async Task<IActionResult> Leave(Guid id)
            => await Send(new LeaveGroupOrderCommand { GroupOrderId = id });

        [HttpDelete("{id:guid}/members/{memberId:guid}")]
        public async Task<IActionResult> RemoveMember(Guid id, Guid memberId)
            => await Send(new RemoveGroupOrderMemberCommand { GroupOrderId = id, MemberId = memberId });

        [HttpPost("{id:guid}/submit")]
        public async Task<IActionResult> Submit(Guid id)
            => await Send(new SubmitGroupOrderCommand { GroupOrderId = id });

        [HttpPost("{id:guid}/cancel")]
        public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelGroupOrderCommand command)
        {
            command.GroupOrderId = id;
            return await Send(command);
        }

        private async Task<IActionResult> Send<T>(T command) where T : Core.Base.BaseCommand, IRequest<Core.Base.ApiResponse>
        {
            command.CurrentUserId = userDto?.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }
    }
}
