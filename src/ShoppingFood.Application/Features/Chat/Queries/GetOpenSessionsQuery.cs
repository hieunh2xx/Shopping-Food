using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Chat.Queries
{
    public class GetOpenSessionsQuery : BaseQuery, IRequest<ApiResponse>
    {
    }
}
