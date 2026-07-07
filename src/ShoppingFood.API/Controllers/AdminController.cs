using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.Admin.Commands;
using ShoppingFood.Application.Features.Admin.Queries;
using ShoppingFood.Application.Features.LoyaltyPoints.Commands;
using ShoppingFood.Application.Features.LoyaltyPoints.Queries;
using ShoppingFood.Application.Features.Notifications.Commands;
using ShoppingFood.Application.Features.Products.GlobalMenuCategories.Commands;
using ShoppingFood.Application.Features.Products.GlobalMenuCategories.Queries;
using ShoppingFood.Application.Features.Support.Commands;
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

        [HttpPost("Restaurants/{id}/toggle-verification")]
        public async Task<ActionResult<ApiResponse>> ToggleRestaurantVerification(Guid id)
        {
            var response = await _mediator.Send(new ToggleRestaurantVerificationCommand { RestaurantId = id });
            return Ok(response);
        }

        [HttpPut("shippers/{id}/suspend")]
        public async Task<ActionResult<ApiResponse>> SuspendShipper(Guid id, [FromBody] AdminSuspendShipperCommand command)
        {
            command.ShipperId = id;
            var response = await _mediator.Send(command);
            if (response.Error)
                return StatusCode(response.Code, response);

            return Ok(response);
        }

        [HttpPost("notifications/broadcast")]
        public async Task<ActionResult<ApiResponse>> BroadcastNotification([FromBody] BroadcastNotificationCommand command)
        {
            if (userDto != null)
                command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpGet("review-reports")]
        public async Task<ActionResult<ApiResponse>> GetReviewReports([FromQuery] GetReviewReportsQuery query)
        {
            if(userDto != null)
                query.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpPost("review-reports/{reportId}/moderate")]
        public async Task<ActionResult<ApiResponse>> ModerateReview(Guid reportId, [FromBody] ModerateReviewCommand command)
        {
            if (userDto != null)
                command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("support-tickets")]
        public async Task<ActionResult<ApiResponse>> CreateSupportTicket([FromBody] CreateSupportTicketCommand command)
        {
            if(userDto != null)
                command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpGet("users/{id}/complaints")]
        public async Task<ActionResult<ApiResponse>> GetUserComplaintHistory(Guid id)
        {
            var query = new GetUserComplaintHistoryQuery { UserId = id };
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }
        [HttpGet("dashboard/stats")]
        public async Task<ActionResult<ApiResponse>> GetAdminDashboardStats([FromQuery] int days = 7)
        {
            var query = new GetAdminDashboardStatsQuery { Days = days };
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpGet("dashboard/heatmap")]
        public async Task<ActionResult<ApiResponse>> GetOrderHeatmap([FromQuery] int days = 30)
        {
            var query = new GetOrderHeatmapQuery { Days = days };
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpGet("reports/financial")]
        public async Task<IActionResult> ExportFinancialReport([FromQuery] int days = 30, [FromQuery] string format = "excel")
        {
            var query = new ExportFinancialReportQuery { Days = days, Format = format };
            var result = await _mediator.Send(query);
            return File(result.FileContent, result.ContentType, result.FileName);
        }

        [HttpGet("system/maintenance")]
        public async Task<ActionResult<ApiResponse>> GetMaintenanceSettings()
        {
            var query = new GetMaintenanceSettingsQuery();
            var response = await _mediator.Send(query);
            return Ok(ApiResponse.Success(response, "Thành công"));
        }

        [HttpPost("system/maintenance")]
        public async Task<ActionResult<ApiResponse>> UpdateMaintenanceSettings([FromBody] UpdateMaintenanceSettingsCommand command)
        {
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("system/legal")]
        public async Task<ActionResult<ApiResponse>> UpdateLegalSettings([FromBody] UpdateLegalSettingsCommand command)
        {
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }
        [HttpGet("finance-config")]
        public async Task<ActionResult<ApiResponse>> GetPlatformFinanceConfig([FromQuery] GetPlatformFinanceConfigQuery query)
        {
            var response = await _mediator.Send(query);
            return Ok(ApiResponse.Success(response));
        }

        [HttpPut("finance-config")]
        public async Task<ActionResult<ApiResponse>> UpdatePlatformFinanceConfig([FromBody] UpdatePlatformFinanceConfigCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(ApiResponse.Success(response));
        }

        [HttpGet("finance-config/restaurants")]
        public async Task<ActionResult<ApiResponse>> GetRestaurantCommissions([FromQuery] GetRestaurantCommissionsQuery query)
        {
            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpPut("finance-config/restaurants/{id}")]
        public async Task<ActionResult<ApiResponse>> UpdateRestaurantCommission(Guid id, [FromBody] UpdateRestaurantCommissionCommand command)
        {
            command.RestaurantId = id;
            var response = await _mediator.Send(command);
            return response ? Ok(ApiResponse.Success(null, "Cập nhật thành công")) : BadRequest(ApiResponse.Failure(400, "Cập nhật thất bại"));
        }

        [HttpPost("users/staff")]
        public async Task<ActionResult<ApiResponse>> CreateStaff([FromBody] CreateStaffCommand command)
        {
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPut("users/{userId}/toggle-status")]
        public async Task<IActionResult> ToggleUserStatus(Guid userId)
        {
            var response = await _mediator.Send(new ToggleUserStatusCommand { UserId = userId });
            return StatusCode(response.Code, response);
        }

        [HttpGet("permissions/endpoints")]
        public async Task<ActionResult<ApiResponse>> GetApiEndpoints()
        {
            var response = await _mediator.Send(new GetApiEndpointsQuery());
            return StatusCode(response.Code, response);
        }

        [HttpGet("permissions/role/{role}")]
        public async Task<ActionResult<ApiResponse>> GetRolePermissions(ShoppingFood.Domain.Enums.UserRole role)
        {
            var response = await _mediator.Send(new GetRolePermissionsQuery { Role = role });
            return StatusCode(response.Code, response);
        }

        [HttpPut("permissions/role/{role}")]
        public async Task<ActionResult<ApiResponse>> UpdateRolePermissions(ShoppingFood.Domain.Enums.UserRole role, [FromBody] UpdateRolePermissionsCommand command)
        {
            command.Role = role;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }
    }
}
