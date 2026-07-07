using System;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetRolePermissionsQuery : BaseQuery, IRequest<ApiResponse>
    {
        public UserRole Role { get; set; }
    }
}
