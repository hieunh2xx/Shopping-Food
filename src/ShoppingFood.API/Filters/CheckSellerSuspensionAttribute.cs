using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Security;
using System.Linq;

namespace ShoppingFood.API.Filters
{
    public class CheckSellerSuspensionAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var user = (context.HttpContext.User as MyPrincipal)?.UserDto;
          
            if (user != null && (user.Role == "Seller" || user.Role == "Mall"))
            {
               
                var method = context.HttpContext.Request.Method.ToUpper();
                if (method == "POST" || method == "PUT" || method == "PATCH" || method == "DELETE")
                {
                    var dbContext = context.HttpContext.RequestServices.GetService<ShoppingFoodContext>();
                    if (dbContext != null)
                    {
                        var restaurant = dbContext.RestaurantProfiles
                            .Where(r => r.OwnerId == user.Id) 
                            .Select(r => r.Status)
                            .FirstOrDefault();

                   
                        var profileId = dbContext.UserProfiles
                            .Where(p => p.UserAccountId == user.Id)
                            .Select(p => p.Id)
                            .FirstOrDefault();

                        var status = dbContext.RestaurantProfiles
                            .Where(r => r.OwnerId == profileId)
                            .Select(r => r.Status)
                            .FirstOrDefault();

                        if (status == RestaurantStatus.Suspended)
                        {
                            context.Result = new ObjectResult(ApiResponse.Failure(403, "Cửa hàng của bạn đang bị khóa. Không thể thực hiện thao tác này."))
                            {
                                StatusCode = 403
                            };
                            return;
                        }
                    }
                }
            }

            base.OnActionExecuting(context);
        }
    }
}
