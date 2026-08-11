using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class ApproveShipperApplicationHandler : IRequestHandler<ApproveShipperApplicationCommand, ApiResponse>
    {
        private readonly IShipperApplicationRepository _shipperApplicationRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IEmailService _emailService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ShoppingFoodContext _dbContext;
        private readonly INotificationPushService _notificationPushService;

        public ApproveShipperApplicationHandler(
            IShipperApplicationRepository shipperApplicationRepository,
            IShipperProfileRepository shipperProfileRepository,
            IUserRepository userRepository, 
            INotificationRepository notificationRepository, 
            IEmailService emailService,
            IUnitOfWork unitOfWork,
            ShoppingFoodContext dbContext,
            INotificationPushService notificationPushService) 
        {
            _shipperApplicationRepository = shipperApplicationRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _userRepository = userRepository;
            _notificationRepository = notificationRepository;
            _emailService = emailService;
            _unitOfWork = unitOfWork;
            _dbContext = dbContext;
            _notificationPushService = notificationPushService;
        }
        public async Task<ApiResponse> Handle(ApproveShipperApplicationCommand request, CancellationToken cancellationToken)
        {
            using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var adminProfile = await GetAdminProfileAsync(request.CurrentUserId.Value);
                if (adminProfile == null)
                    return ApiResponse.Failure(401, "User profile not found.");

                var application = await GetApplicationWithDetailAsync(request.ApplicationId);
                if (application == null)
                    return ApiResponse.Failure(404, "Application not found");

                if (application.Status != ApplicationStatus.Pending && application.Status != ApplicationStatus.NeedsInfo)
                    return ApiResponse.Failure(400, $"Shipper application is already processed. Current status: {application.Status}");

                if (request.Action == "Approve")
                    ApproveApplication(application, adminProfile.Id);
                else if (request.Action == "Reject")
                    RejectApplication(application, request.RejectionReason, adminProfile.Id);
                else if (request.Action == "NeedsInfo")
                    NeedsInfoApplication(application, request.RejectionReason, adminProfile.Id);

                var notification = AddDbNotification(application, request.Action);

                await _unitOfWork.SaveChangesAsync();

                try 
                {
                    await SendEmailNotificationAsync(application, request.Action);
                }
                catch (Exception emailEx)
                {
                    // Log email failure but do not rollback the approval transaction
                    await _unitOfWork.LogErrorAsync("ApproveShipperApplicationHandler.SendEmail", emailEx);
                }

                await transaction.CommitAsync(cancellationToken);

                if (notification != null)
                {
                    await _notificationPushService.PushToUserAsync(notification.UserId, new
                    {
                        title = notification.Title,
                        message = notification.Message,
                        type = "System",
                        link = "/profile?tab=applications"
                    });
                }

                string successMessage = request.Action switch
                {
                    "Approve" => "Shipper application has been approved. The user is now active as shipper.",
                    "Reject" => "Shipper application has been rejected.",
                    "NeedsInfo" => "Shipper application has been returned for additional information.",
                    _ => "Shipper application processed."
                };
                return ApiResponse.Success(null, successMessage);
            }
            catch (Exception ex) 
            {
                await transaction.RollbackAsync(cancellationToken);
                await _unitOfWork.LogErrorAsync("ApproveShipperApplicationHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task<UserProfile?> GetAdminProfileAsync(Guid userId)
        {
            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == userId,
                include: q => q.Include(u => u.Profile)
                );
            var user = users.FirstOrDefault();
            return user?.Profile;
        }

        private async Task<ShipperApplication?> GetApplicationWithDetailAsync(Guid applicationId)
        {
            var applications = await _shipperApplicationRepository.GetAsync(
                predicate: a => a.Id == applicationId,
                include: q => q.Include(a => a.UserProfile).ThenInclude(p => p.UserAccount),
                disableTracking: false
                );
            return applications.FirstOrDefault();
        }

        private void ApproveApplication(ShipperApplication application, Guid adminProfileId)
        {
            application.Status = ApplicationStatus.Approved;
            if(application.UserProfile != null)
            {
                application.UserProfile.Role = UserRole.Shipper;
                application.UserProfile.UpdatedAt = DateTime.UtcNow;
                _userRepository.Update(application.UserProfile.UserAccount);

                var shipperProfile = CreateShipperProfileEntity(application);
                _shipperProfileRepository.Add(shipperProfile);
            }
            SetReviewMetaData(application, adminProfileId);
        }

        private ShipperProfile CreateShipperProfileEntity(ShipperApplication application)
        {
            return new ShipperProfile
            {
                Id = Guid.NewGuid(),
                UserProfileId = application.UserProfileId,
                ShipperApplicationId = application.Id,
                VehicleType = application.VehicleType,
                VehiclePlateNumber = application.VehiclePlateNumber,
                IsOnline = false,
                Status = UserStatus.Active,
                WalletBalance = 0,
                ReputationScore = 100,
                Rating = 5.0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        private void RejectApplication(ShipperApplication application,string rejectionReason ,Guid adminProfileId)
        {
            application.Status = ApplicationStatus.Rejected;
            application.RejectionReason = rejectionReason;
            SetReviewMetaData(application, adminProfileId);
        }

        private void NeedsInfoApplication(ShipperApplication application, string rejectionReason, Guid adminProfileId)
        {
            application.Status = ApplicationStatus.NeedsInfo;
            application.RejectionReason = rejectionReason;
            SetReviewMetaData(application, adminProfileId);
        }
        private void SetReviewMetaData(ShipperApplication application, Guid adminProfileId)
        {
            application.ReviewedBy = adminProfileId;
            application.ReviewedAt = DateTime.UtcNow;
            application.UpdatedAt = DateTime.UtcNow;
        }

        private Notification? AddDbNotification(ShipperApplication application, string action)
        {
            var userAccountId = application.UserProfile?.UserAccountId;
            if (userAccountId.HasValue)
            {
                string title = action switch
                {
                    "Approve" => "Yêu cầu đăng ký tài xế đã được duyệt",
                    "Reject" => "Yêu cầu đăng ký tài xế bị từ chối",
                    "NeedsInfo" => "Yêu cầu đăng ký tài xế cần bổ sung",
                    _ => "Thông báo trạng thái"
                };

                string message = action switch
                {
                    "Approve" => "Chúc mừng! Đơn đăng ký trở thành đối tác tài xế của bạn đã được phê duyệt thành công. Vui lòng đăng nhập lại để bắt đầu nhận đơn.",
                    "Reject" => $"Đơn đăng ký trở thành đối tác tài xế của bạn đã bị từ chối. Lý do {application.RejectionReason}.",
                    "NeedsInfo" => $"Đơn đăng ký tài xế cần bổ sung. Yêu cầu: {application.RejectionReason}. Vào Hồ sơ → Lịch sử đăng ký để bổ sung thông tin và gửi lại.",
                    _ => ""
                };

                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = userAccountId.Value,
                    Title = title,
                    Message = message,
                    NotificationType = NotificationType.System,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                };
                _notificationRepository.Add(notification);
                return notification;
            }
            return null;
        }

        private async Task SendEmailNotificationAsync(ShipperApplication application, string action)
        {
            var email = application.UserProfile?.UserAccount?.Email;
            if (!string.IsNullOrEmpty(email))
            {
                string subject = action switch
                {
                    "Approve" => "Thông báo duyệt hồ sơ đối tác tài xế - ShoppingFood",
                    "Reject" => "Thông báo kết quả hồ sơ đối tác tài xế - ShoppingFood",
                    "NeedsInfo" => "Yêu cầu bổ sung hồ sơ đối tác tài xế - ShoppingFood",
                    _ => "Thông báo trạng thái đăng ký"
                };

                string body = action switch
                {
                    "Approve" => $"<p>Xin chào <strong>{application.UserProfile.FullName}</strong>,</p><p>Hồ sơ đăng ký đối tác tài xế của bạn đã được phê duyệt thành công trên hệ thống ShoppingFood.</p><p>Bạn đã có thể bắt đầu hoạt động và nhận đơn giao hàng. Chúc bạn có những hành trình thuận lợi!</p>",
                    "Reject" => $"<p>Xin chào <strong>{application.UserProfile.FullName}</strong>,</p><p>Đơn đăng ký đối tác tài xế của bạn chưa được phê duyệt.</p><p><strong>Lý do từ chối:</strong> {application.RejectionReason}</p>",
                    "NeedsInfo" => $"<p>Xin chào <strong>{application.UserProfile.FullName}</strong>,</p><p>Đơn đăng ký đối tác tài xế của bạn cần bổ sung thêm thông tin.</p><p><strong>Yêu cầu từ Admin:</strong> {application.RejectionReason}</p><p>Vui lòng vào <strong>Hồ sơ → Lịch sử đăng ký</strong>, chọn đơn và nhấn <strong>Bổ sung thông tin</strong>.</p>",
                    _ => ""
                };

                await _emailService.SendEmailAsync(email, subject, body);
            }
        }
    }
}
