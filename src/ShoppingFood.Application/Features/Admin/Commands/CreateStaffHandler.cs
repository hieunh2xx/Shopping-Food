using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.User;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class CreateStaffHandler : IRequestHandler<CreateStaffCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public CreateStaffHandler(IUserRepository userRepository, IUnitOfWork unitOfWork, IMapper mapper)
        {
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(CreateStaffCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Validate if user exists
                var existingUserList = await _userRepository.GetAsync(u => u.UserName == request.UserName);
                var existingUser = existingUserList.FirstOrDefault();
                if (existingUser != null)
                {
                    return ApiResponse.Failure(400, "Username already exists.");
                }

                // Create User
                var user = new User
                {
                    Id = Guid.NewGuid(),
                    UserName = request.UserName,
                    PasswordHash = HashPassword(request.Password),
                    Status = UserStatus.Active,
                    Email = request.Email,
                    Phone = request.Phone
                };

                // Create Profile
                var profile = new UserProfile
                {
                    Id = Guid.NewGuid(),
                    UserAccountId = user.Id,
                    FullName = request.FullName,
                    Role = request.Role,
                    AvatarUrl = request.AvatarUrl,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                user.Profile = profile;

                _userRepository.Add(user);
                await _unitOfWork.SaveChangesAsync();

                var userDto = _mapper.Map<UserDto>(user);
                return ApiResponse.Success(userDto, "Internal account created successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("CreateStaffHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(bytes);
        }
    }
}
