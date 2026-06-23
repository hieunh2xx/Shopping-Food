using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Carts.Commands
{
    public class RemoveCartItemCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid ProductId { get; set; }
        public Guid? GuestUserId { get; set; }
    }
}
