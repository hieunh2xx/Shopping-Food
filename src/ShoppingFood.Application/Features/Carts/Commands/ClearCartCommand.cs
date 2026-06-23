using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Carts.Commands
{
    public class ClearCartCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid? GuestUserId { get; set; }
    }
}
