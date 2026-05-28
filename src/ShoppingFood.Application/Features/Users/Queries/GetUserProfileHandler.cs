using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.User;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Users.Queries
{
    public class GetUserProfileHandler : IRequestHandler<GetUserProfileQuery, ApiResponse>
    {
        private readonly IUserRepository _userRepository;

        public GetUserProfileHandler(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<ApiResponse> Handle(GetUserProfileQuery request, CancellationToken cancellationToken)
        {
            var existingUsers = await _userRepository.GetAsync(
                predicate: u => u.UserName == request.Username,
                include: q => q.Include(u => u.Profile)
            );
            var user = existingUsers.FirstOrDefault();

            if (user == null)
            {
                return ApiResponse.Failure(404, "User not found.");
            }

            var userDto = new UserDto
            {
                Id = user.Id,
                UserName = user.UserName!,
                FullName = user.Profile?.FullName ?? user.UserName!,
                Role = user.Profile?.Role.ToString() ?? "Customer",
                Status = user.Status.ToString(),
                Email = user.Email,
                Phone = user.Phone,
                AvatarUrl = user.Profile?.AvatarUrl,
                CreatedAt = user.CreatedAt
            };

            return ApiResponse.Success(userDto, "User profile retrieved successfully.");
        }
    }
}
