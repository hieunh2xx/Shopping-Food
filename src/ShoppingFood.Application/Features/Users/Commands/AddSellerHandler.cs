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

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class AddSellerHandler : IRequestHandler<AddSellerCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly ISellerApplicationRepository _sellerApplicationRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public AddSellerHandler(
            IUserRepository userRepository,
            ISellerApplicationRepository sellerApplicationRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _userRepository = userRepository;
            _sellerApplicationRepository = sellerApplicationRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(AddSellerCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var user = CreateUserEntity(request);
                var profile = CreateUserProfileEntity(user.Id, request);
                user.Profile = profile;

                var application = CreateSellerApplicationEntity(profile.Id, request);

                _userRepository.Add(user);
                _sellerApplicationRepository.Add(application);

                await _unitOfWork.SaveChangesAsync();

                var result = new SellerRegisterDto
                {
                    Id = user.Id,
                    SellerApplicationId = application.Id,
                    UserName = user.UserName!,
                    Email = user.Email!,
                    BusinessName = application.BusinessName,
                    SellerApllicationStatus = application.Status.ToString()
                };

                return ApiResponse.Success(result, "Seller registration submitted successfully. Application is pending review.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("AddSellerHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private User CreateUserEntity(AddSellerCommand request)
        {
            return new User
            {
                Id = Guid.NewGuid(),
                UserName = request.UserName,
                PasswordHash = HashPassword(request.Password),
                Phone = request.Phone,
                Email = request.Email,
                Status = UserStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        private UserProfile CreateUserProfileEntity(Guid userAccountId, AddSellerCommand request)
        {
            return new UserProfile
            {
                Id = Guid.NewGuid(),
                UserAccountId = userAccountId,
                FullName = request.BusinessName,
                Role = UserRole.Customer,
                AvatarUrl = request.AvatarUrl,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        private SellerApplication CreateSellerApplicationEntity(Guid userProfileId, AddSellerCommand request)
        {
            return new SellerApplication
            {
                Id = Guid.NewGuid(),
                UserProfileId = userProfileId,
                BusinessName = request.BusinessName,
                BusinessAddress = request.BusinessAddress,
                BusinessLicenseUrl = request.BusinessLicenseUrl,
                ShopImageUrl = request.ShopImageUrl,
                ContactInfo = request.ContactInfo,
                Status = SellerApplicationStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
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
