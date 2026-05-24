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
                var user = new User
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

                var profile = new UserProfile
                {
                    Id = Guid.NewGuid(),
                    UserAccountId = user.Id,
                    FullName = request.BusinessName,
                    Role = UserRole.Seller,
                    AvatarUrl = request.AvatarUrl,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                user.Profile = profile;

                var application = new SellerApplication
                {
                    Id = Guid.NewGuid(),
                    UserProfileId = profile.Id,
                    BusinessName = request.BusinessName,
                    BusinessAddress = request.BusinessAddress,
                    BusinessLicenseUrl = request.BusinessLicenseUrl,
                    ShopImageUrl = request.ShopImageUrl,
                    ContactInfo = request.ContactInfo,
                    Status = SellerApplicationStatus.Pending,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

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
                return ApiResponse.Failure(500, $"An error occurred: {ex.Message}");
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
