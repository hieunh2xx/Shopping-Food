using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.System.Queries
{
    public class GetSystemErrorLogsQuery : BaseQuery, IRequest<ApiResponse>
    {
        public string OrderDirection { get; set; } = "desc";
    }
}
