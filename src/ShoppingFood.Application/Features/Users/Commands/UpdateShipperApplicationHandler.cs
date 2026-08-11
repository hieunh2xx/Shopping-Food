using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class UpdateShipperApplicationHandler : IRequestHandler<UpdateShipperApplicationCommand, ApiResponse>
    {
        private readonly INotificationPushService _notificationPushService;
        private readonly INotificationRepository _notificationRepository;
        private readonly IShipperApplicationRepository _shipperApplicationRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateShipperApplicationHandler(
            IShipperApplicationRepository shipperApplicationRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork,
            INotificationPushService notificationPushService,
            INotificationRepository notificationRepository)
        {
            _shipperApplicationRepository = shipperApplicationRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _notificationPushService = notificationPushService;
            _notificationRepository = notificationRepository;
        }

        public async Task<ApiResponse> Handle(UpdateShipperApplicationCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var userProfile = await GetUserProfileAsync(request.CurrentUserId.Value);
                if (userProfile == null)
                    return ApiResponse.Failure(404, "User profile not found.");

                var applications = await _shipperApplicationRepository.GetAsync(
                    predicate: a => a.Id == request.Id,
                    disableTracking: false
                );
                var application = applications.FirstOrDefault();

                if (application == null)
                    return ApiResponse.Failure(404, "Shipper application not found.");

                if (application.UserProfileId != userProfile.Id)
                    return ApiResponse.Failure(403, "Forbidden. You do not own this application.");

                if (application.Status == ApplicationStatus.Approved)
                    return ApiResponse.Failure(400, $"Cannot update application. Current status is {application.Status}.");
                
                if (application.Status == ApplicationStatus.Rejected)
                    return ApiResponse.Failure(400, "Your application has been rejected and cannot be updated.");

                application.IdentityCardNumber = request.IdentityCardNumber;
                application.IdentityCardFrontUrl = request.IdentityCardFrontUrl;
                application.IdentityCardBackUrl = request.IdentityCardBackUrl;
                application.VehicleType = request.VehicleType;
                application.VehiclePlateNumber = request.VehiclePlateNumber;
                application.DriverLicenseUrl = request.DriverLicenseUrl;
                application.VehicleRegistrationUrl = request.VehicleRegistrationUrl;

                application.Status = ApplicationStatus.Pending; // Reset to pending after update
                application.RejectionReason = null;
                application.UpdatedAt = DateTime.UtcNow;

                var title = "Yêu cầu Đăng ký giao hàng được bổ sung";
                var message = $"Người dùng {userProfile.FullName} đã bổ sung thông tin cho đơn đăng ký Giao hàng.";

                var admins = await _userRepository.GetAsync(
                    predicate: u => u.Profile != null && u.Profile.Role == Domain.Enums.UserRole.Admin,
                    include: q => q.Include(u => u.Profile),
                    disableTracking: true
                );

                var notificationsToPush = new List<Notification>();

                foreach (var admin in admins)
                {
                    var notification = new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = admin.Id,
                        Title = title,
                        Message = message,
                        NotificationType = Domain.Enums.NotificationType.System,
                        IsRead = false,
                        CreateAt = DateTime.UtcNow
                    };
                    _notificationRepository.Add(notification);
                    notificationsToPush.Add(notification);
                }

                _shipperApplicationRepository.Update(application);
                await _unitOfWork.SaveChangesAsync();

                foreach (var notification in notificationsToPush)
                {
                    await _notificationPushService.PushToUserAsync(notification.UserId, new {
                        title = notification.Title,
                        message = notification.Message,
                        type = "System",
                        link = "/admin/approvals"
                    });
                }

                return ApiResponse.Success(null, "Shipper application updated and resubmitted successfully");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("UpdateShipperApplicationHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task<UserProfile?> GetUserProfileAsync(Guid userId)
        {
            var user = await _userRepository.GetAsync(
                predicate: u => u.Id == userId,
                include: q => q.Include(u => u.Profile)
            );
            return user.FirstOrDefault()?.Profile;
        }
    }
}
