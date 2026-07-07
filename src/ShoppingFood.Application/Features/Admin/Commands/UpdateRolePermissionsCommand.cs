using System;
using System.Collections.Generic;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class UpdateRolePermissionsCommand : BaseCommand, IRequest<ApiResponse>
    {
        public UserRole Role { get; set; }
        public List<Guid> ApiEndpointIds { get; set; } = new List<Guid>();
    }
}
