using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Chat.Queries
{
    public class GetCustomerChatsQuery : BaseQuery, IRequest<ApiResponse>
    {
    }
}
