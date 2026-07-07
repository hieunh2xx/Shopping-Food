using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetRolePermissionsHandler : IRequestHandler<GetRolePermissionsQuery, ApiResponse>
    {
        private readonly IRolePermissionRepository _rolePermissionRepository;

        public GetRolePermissionsHandler(IRolePermissionRepository rolePermissionRepository)
        {
            _rolePermissionRepository = rolePermissionRepository;
        }

        public async Task<ApiResponse> Handle(GetRolePermissionsQuery request, CancellationToken cancellationToken)
        {
            var perms = await _rolePermissionRepository.GetAsync(rp => rp.Role == request.Role);
            var endpointIds = perms.Select(rp => rp.ApiEndpointId).ToList();

            return ApiResponse.Success(endpointIds);
        }
    }
}
