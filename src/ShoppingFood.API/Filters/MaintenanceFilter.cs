using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using System.Threading.Tasks;
using MediatR;
using ShoppingFood.Application.Features.Admin.Queries;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.API.Filters
{
    public class MaintenanceFilter : IAsyncActionFilter
    {
        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var path = context.HttpContext.Request.Path.Value?.ToLowerInvariant();
            
            // Lấy ISender để gửi query
            var sender = context.HttpContext.RequestServices.GetRequiredService<ISender>();
            var settings = await sender.Send(new GetMaintenanceSettingsQuery());

            bool isMaintenance = settings.IsMaintenanceMode || (settings.ScheduledStartTime.HasValue && DateTime.UtcNow >= settings.ScheduledStartTime.Value);

            if (isMaintenance)
            {
                // Cho phép các API Login, admin và webhook thanh toán (SePay gọi từ bên ngoài)
                if (path != null && (
                    path.StartsWith("/api/user/login") ||
                    path.StartsWith("/api/admin") ||
                    path.StartsWith("/api/payment/sepay/ipn") ||
                    path.StartsWith("/api/payment/sepay/webhook")))
                {
                    await next();
                    return;
                }

                // Nếu request đã đăng nhập, và có role Admin thì cho đi tiếp
                if (context.HttpContext.User.Identity?.IsAuthenticated == true && context.HttpContext.User.IsInRole("Admin"))
                {
                    await next();
                    return;
                }

                // Nếu không, trả về lỗi 503
                var response = ApiResponse.Failure(503, "Hệ thống đang được bảo trì nâng cấp. Vui lòng quay lại sau.");
                context.Result = new ObjectResult(response)
                {
                    StatusCode = 503
                };
                return;
            }

            await next();
        }
    }
}
