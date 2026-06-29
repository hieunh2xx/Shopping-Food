using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Notifications.Queries
{
    public class GetNotificationsQuery : BaseQuery, IRequest<ApiResponse>
    {
    }
}
