using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetOrderHeatmapQuery : IRequest<ApiResponse>
    {
        public int Days { get; set; } = 30;
    }
}
