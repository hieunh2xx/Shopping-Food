using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetProductReportsQuery : BaseQuery, IRequest<ApiResponse>
    {
    }
}
