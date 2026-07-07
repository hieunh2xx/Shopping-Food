using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class ToggleUserStatusCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid UserId { get; set; }
    }
}
