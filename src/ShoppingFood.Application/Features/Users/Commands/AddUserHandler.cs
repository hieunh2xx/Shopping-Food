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
using FirebaseAdmin.Auth;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class AddUserHandler : IRequestHandler<AddUserCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ShoppingFood.Domain.Context.ShoppingFoodContext _dbContext;

        public AddUserHandler(IUserRepository userRepository, IUnitOfWork unitOfWork, IMapper mapper, ShoppingFood.Domain.Context.ShoppingFoodContext dbContext)
        {
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _dbContext = dbContext;
        }

        public async Task<ApiResponse> Handle(AddUserCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (string.IsNullOrEmpty(request.OtpCode))
                {
                    return ApiResponse.Failure(400, "Firebase ID Token is required for registration.");
                }

                FirebaseToken decodedToken;
                try
                {
                    decodedToken = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(request.OtpCode, cancellationToken);
                }
                catch (Exception ex)
                {
                    return ApiResponse.Failure(401, "Invalid Firebase ID Token: " + ex.Message);
                }

                if (!decodedToken.Claims.TryGetValue("phone_number", out var phoneObj) || phoneObj == null)
                {
                    return ApiResponse.Failure(400, "Phone number not found in Firebase Token.");
                }

                var phone = phoneObj.ToString();
                if (phone.StartsWith("+84")) phone = "0" + phone.Substring(3);

                if (phone != request.Phone)
                {
                    return ApiResponse.Failure(400, "Phone number in token does not match requested phone.");
                }

                var user = _mapper.Map<User>(request);
                user.Id = Guid.NewGuid();
                user.PasswordHash = HashPassword(request.Password);
                user.Status = UserStatus.Active;

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
                return ApiResponse.Success(userDto, "User registered successfully");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("AddUserHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private static string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }
    }
}
