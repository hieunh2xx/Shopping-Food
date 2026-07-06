using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Chat.Queries
{
    public class GetSellerOrderChatsQuery : BaseQuery, IRequest<ApiResponse>
    {
    }
}
