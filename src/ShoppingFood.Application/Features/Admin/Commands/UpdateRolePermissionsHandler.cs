using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class UpdateRolePermissionsHandler : IRequestHandler<UpdateRolePermissionsCommand, ApiResponse>
    {
        private readonly IRolePermissionRepository _rolePermissionRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateRolePermissionsHandler(IRolePermissionRepository rolePermissionRepository, IUnitOfWork unitOfWork)
        {
            _rolePermissionRepository = rolePermissionRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(UpdateRolePermissionsCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Remove all existing permissions for this role
                var existingPerms = await _rolePermissionRepository.GetAsync(rp => rp.Role == request.Role);
                
                foreach (var perm in existingPerms)
                {
                    _rolePermissionRepository.Delete(perm);
                }

                // Add new permissions
                if (request.ApiEndpointIds != null && request.ApiEndpointIds.Any())
                {
                    foreach (var id in request.ApiEndpointIds)
                    {
                        var newPerm = new RolePermission
                        {
                            Id = Guid.NewGuid(),
                            Role = request.Role,
                            ApiEndpointId = id,
                            CreatedAt = DateTime.UtcNow
                        };
                        _rolePermissionRepository.Add(newPerm);
                    }
                }

                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(null, "Role permissions updated successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("UpdateRolePermissionsHandler", ex);
                return ApiResponse.Failure(400, $"Error updating role permissions: {ex.Message}");
            }
        }
    }
}
