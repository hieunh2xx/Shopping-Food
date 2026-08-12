using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class UpgradeToMallHandler : IRequestHandler<UpgradeToMallCommand, ApiResponse>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly ISellerApplicationRepository _sellerApplicationRepository;
        private readonly INotificationRepository _notificationRepository;

        public UpgradeToMallHandler(
            IUnitOfWork unitOfWork,
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            ISellerApplicationRepository sellerApplicationRepository,
            INotificationRepository notificationRepository)
        {
            _unitOfWork = unitOfWork;
            _userRepository = userRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _sellerApplicationRepository = sellerApplicationRepository;
            _notificationRepository = notificationRepository;
        }

        public async Task<ApiResponse> Handle(UpgradeToMallCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                {
                    return ApiResponse.Failure(401, "Unauthorized");
                }

                // Check if user is seller
                var users = await _userRepository.GetAsync(
                    predicate: u => u.Id == request.CurrentUserId.Value,
                    include: q => q.Include(u => u.Profile)
                );
                var user = users.FirstOrDefault();

                if (user?.Profile == null || user.Profile.Role != UserRole.Seller)
                {
                    return ApiResponse.Failure(403, "Only sellers can request to upgrade to Mall.");
                }

                // Check if restaurant profile exists
                var restaurants = await _restaurantProfileRepository.GetAsync(r => r.OwnerId == user.Profile.Id && r.Status == RestaurantStatus.Active);
                var restaurant = restaurants.FirstOrDefault();

                if (restaurant == null)
                {
                    return ApiResponse.Failure(400, "Restaurant profile not found for this seller.");
                }

                // Check if they already have a pending upgrade
                var existingApps = await _sellerApplicationRepository.GetAsync(a => a.UserProfileId == user.Profile.Id && a.Type == ApplicationType.UpgradeToMall && a.Status == ApplicationStatus.Pending);
                if (existingApps.Any())
                {
                    return ApiResponse.Failure(400, "You already have a pending Mall upgrade application.");
                }

                var application = new SellerApplication
                {
                    Id = Guid.NewGuid(),
                    UserProfileId = user.Profile.Id,
                    BusinessName = restaurant.RestaurantName,
                    BusinessAddress = restaurant.Address,
                    ContactInfo = restaurant.Phone,
                    ApplicationReason = request.Reason,
                    Type = ApplicationType.UpgradeToMall,
                    Status = ApplicationStatus.Pending,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _sellerApplicationRepository.Add(application);

                // Notify Admins
                await NotifyAdminsAsync(restaurant.RestaurantName);

                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(null, "Your request to upgrade to Mall has been submitted and is pending review.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("UpgradeToMallHandler.Handle", ex);
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
                    Title = "Yêu cầu nâng cấp Mall mới",
                    Message = $"Cửa hàng {businessName} vừa gửi yêu cầu nâng cấp lên ShoppingFood Mall. Vào mục Duyệt đối tác để kiểm tra và phê duyệt.",
                    NotificationType = NotificationType.System,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow,
                });
            }
        }
    }
}
