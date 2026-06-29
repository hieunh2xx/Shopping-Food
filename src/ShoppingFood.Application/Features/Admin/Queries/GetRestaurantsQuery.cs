using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetRestaurantsQuery : BaseQuery, IRequest<ApiResponse>
    {
        public string? Status { get; set; }
    }
}
