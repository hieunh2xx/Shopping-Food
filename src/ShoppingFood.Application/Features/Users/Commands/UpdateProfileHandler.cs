using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Context;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class UpdateProfileHandler : IRequestHandler<UpdateProfileCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _dbContext;

        public UpdateProfileHandler(ShoppingFoodContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<ApiResponse> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
        {
            if (request.CurrentUserId == Guid.Empty)
            {
                return ApiResponse.Failure(401, "Unauthorized");
            }

            var profile = await _dbContext.UserProfiles
                .FirstOrDefaultAsync(p => p.UserAccountId == request.CurrentUserId, cancellationToken);

            if (profile == null)
            {
                return ApiResponse.Failure(404, "User profile not found");
            }

            if (!string.IsNullOrEmpty(request.FullName))
            {
                profile.FullName = request.FullName;
            }

            if (!string.IsNullOrEmpty(request.AvatarUrl))
            {
                profile.AvatarUrl = request.AvatarUrl;
            }

            if (!string.IsNullOrEmpty(request.Gender))
            {
                profile.Gender = request.Gender;
            }

            if (request.DateOfBirth.HasValue)
            {
                profile.DateOfBirth = request.DateOfBirth;
            }

            profile.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);

            return ApiResponse.Success(null, "Profile updated successfully");
        }
    }
}
