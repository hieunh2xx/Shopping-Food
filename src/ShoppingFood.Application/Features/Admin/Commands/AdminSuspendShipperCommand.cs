using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class AdminSuspendShipperCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid ShipperId { get; set; }
        public bool IsLocked { get; set; }
    }
}
