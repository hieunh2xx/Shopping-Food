using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Admin;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetRestaurantCommissionsQuery : BaseQuery, IRequest<ApiResponse>
    {
    }
}
