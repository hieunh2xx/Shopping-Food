using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Users.Queries
{
    public class GetUserQuery : BaseQuery, IRequest<ApiResponse>
    {
    }
}
