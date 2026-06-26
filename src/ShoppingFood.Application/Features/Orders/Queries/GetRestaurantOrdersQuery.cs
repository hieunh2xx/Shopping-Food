using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetRestaurantOrdersQuery : BaseQuery, IRequest<ApiResponse>
    {
        public OrderStatus? Status { get; set; }
    }
}
