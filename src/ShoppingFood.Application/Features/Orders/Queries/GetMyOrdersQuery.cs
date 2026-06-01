using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetMyOrdersQuery : BaseQuery, IRequest<ApiResponse>
    {
        public string Username { get; set; } = string.Empty;
    }
}
