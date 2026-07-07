using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class ApplySellerHandler : IRequestHandler<ApplySellerCommand, ApiResponse>
    {
        private readonly ISellerApplicationRepository _sellerApplicationRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ApplySellerHandler(
            ISellerApplicationRepository sellerApplicationRepository,
            IUserRepository userRepository,
            INotificationRepository notificationRepository,
            IUnitOfWork unitOfWork)
        {
            _sellerApplicationRepository = sellerApplicationRepository;
            _userRepository = userRepository;
            _notificationRepository = notificationRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ApplySellerCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var users = await _userRepository.GetAsync(
                    predicate: u => u.Id == request.CurrentUserId.Value,
                    include: q => q.Include(u => u.Profile)
                );
                var userProfile = users.FirstOrDefault()?.Profile;

                if (userProfile == null)
                    return ApiResponse.Failure(404, "User profile not found.");

                if (userProfile.Role == UserRole.Seller || userProfile.Role == UserRole.Mall)
                    return ApiResponse.Failure(400, "You are already a seller or mall.");

                // Check if an application already exists
                var existingApps = await _sellerApplicationRepository.GetAsync(
                    a => a.UserProfileId == userProfile.Id && a.Type == ApplicationType.NewSeller && a.Status == ApplicationStatus.Pending
                );
                
                if (existingApps.Any())
                    return ApiResponse.Failure(400, "You already have a pending seller application.");

                var application = new SellerApplication
                {
                    Id = Guid.NewGuid(),
                    UserProfileId = userProfile.Id,
                    BusinessName = request.BusinessName,
                    BusinessAddress = request.BusinessAddress,
                    BusinessLicenseUrl = request.BusinessLicenseUrl,
                    ShopImageUrl = request.ShopImageUrl,
                    ContactInfo = request.ContactInfo,
                    Status = ApplicationStatus.Pending,
                    Type = ApplicationType.NewSeller,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _sellerApplicationRepository.Add(application);

                await NotifyAdminsAsync(request.BusinessName);

                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(null, "Seller application submitted successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("ApplySellerHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task NotifyAdminsAsync(string businessName)
        {
            var admins = await _userRepository.GetAsync(
                predicate: u => u.Profile != null && u.Profile.Role == Domain.Enums.UserRole.Admin,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );

            foreach (var admin in admins)
            {
                _notificationRepository.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = admin.Id,
                    Title = "Đăng ký Cửa hàng mới",
                    Message = $"Cửa hàng {businessName} vừa gửi yêu cầu đăng ký Đối tác bán hàng. Vui lòng kiểm tra và duyệt.",
                    NotificationType = Domain.Enums.NotificationType.System,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow,
                });
            }
        }
    }
}
