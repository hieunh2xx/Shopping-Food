using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetRecentOrderItemsQuery : BaseQuery, IRequest<ApiResponse>
    {
    }
}
