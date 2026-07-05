using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Chat.Queries
{
    public class GetCurrentSessionQuery : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
    }
}
