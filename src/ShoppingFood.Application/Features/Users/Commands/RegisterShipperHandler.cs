using AutoMapper;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.User;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class RegisterShipperHandler : IRequestHandler<RegisterShipperCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IShipperApplicationRepository _shipperApplicationRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public RegisterShipperHandler(
            IUserRepository userRepository,
            IShipperApplicationRepository shipperApplicationRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper
            )
        {
            _userRepository = userRepository;
            _shipperApplicationRepository = shipperApplicationRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }
        public async Task<ApiResponse> Handle(RegisterShipperCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var user = CreateUserEntity(request);
                var profile = CreateUserProfileEntity(user.Id, request);
                user.Profile = profile;

                var application = CreateShipperApplicationEntity(profile.Id, request);

                _userRepository.Add(user);
                _shipperApplicationRepository.Add(application);
                await _unitOfWork.SaveChangesAsync();

                var result = CreateResponseDto(user, profile, application);
                return ApiResponse.Success(result, "Shipper registration submitted successfully. Application is pending review.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("RegisterShipperHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }



        private User CreateUserEntity(RegisterShipperCommand request)
        {
            var user = _mapper.Map<User>(request);
            user.Id = Guid.NewGuid();
            user.PasswordHash = HashPassword(request.Password);
            user.Status = UserStatus.Active;
            user.CreatedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            return user;
        }

        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            } 
        }

        private UserProfile CreateUserProfileEntity(Guid userAccountId, RegisterShipperCommand request)
        {
            var profile = _mapper.Map<UserProfile>(request);
            profile.Id = Guid.NewGuid(); 
            profile.UserAccountId = userAccountId;
            profile.Role = UserRole.Customer;
            profile.CreatedAt = DateTime.UtcNow;
            profile.UpdatedAt = DateTime.UtcNow;
            return profile;
        }
        private ShipperApplication CreateShipperApplicationEntity(Guid userProfileId, RegisterShipperCommand request)
        {
            var application = _mapper.Map<ShipperApplication>(request);
            application.Id = Guid.NewGuid();
            application.UserProfileId = userProfileId;
            application.Status = ApplicationStatus.Pending;
            application.CreatedAt = DateTime.UtcNow;
            application.UpdatedAt = DateTime.UtcNow;
            return application;
        }
        private ShipperRegisterDto CreateResponseDto(User user, UserProfile profile, ShipperApplication application)
        {
            return new ShipperRegisterDto
            {
                Id = user.Id,
                ShipperApplicationId = application.Id,
                UserName = user.UserName!,
                FullName = profile.FullName,
                ShipperApplicationStatus = application.Status.ToString()
            };
        }



    }
}
