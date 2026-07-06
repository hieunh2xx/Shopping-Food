using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Admin;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetAdminDashboardStatsQuery : IRequest<ApiResponse>
    {
        public int Days { get; set; } = 7;
    }
}
