using System;
using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.UserAddresses.Commands
{
    public class DeleteUserAddressCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid Id { get; set; }
    }
}
