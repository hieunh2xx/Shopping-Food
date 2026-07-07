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

        public ApproveShipperApplicationHandler(
            IShipperApplicationRepository shipperApplicationRepository,
            IShipperProfileRepository shipperProfileRepository,
            IUserRepository userRepository, 
            INotificationRepository notificationRepository, 
            IEmailService emailService,
            IUnitOfWork unitOfWork,
            ShoppingFoodContext dbContext) 
        {
            _shipperApplicationRepository = shipperApplicationRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _userRepository = userRepository;
            _notificationRepository = notificationRepository;
            _emailService = emailService;
            _unitOfWork = unitOfWork;
            _dbContext = dbContext;
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

                if (application.Status != ApplicationStatus.Pending)
                    return ApiResponse.Failure(400, $"Shipper application is already processed. Current status: {application.Status}");

                if (request.IsApproved)
                    ApproveApplication(application, adminProfile.Id);
                else
                    RejectApplication(application, request.RejectionReason, adminProfile.Id);

                AddDbNotification(application, request.IsApproved);

                await _unitOfWork.SaveChangesAsync();

                await _unitOfWork.SaveChangesAsync();

                try 
                {
                    await SendEmailNotificationAsync(application, request.IsApproved);
                }
                catch (Exception emailEx)
                {
                    // Log email failure but do not rollback the approval transaction
                    await _unitOfWork.LogErrorAsync("ApproveShipperApplicationHandler.SendEmail", emailEx);
                }

                await transaction.CommitAsync(cancellationToken);

                string successMessage = request.IsApproved
                    ? "Shipper application has been approved. The user is now active as shipper."
                    : "Shipper application has been rejected.";
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
        private void SetReviewMetaData(ShipperApplication application, Guid adminProfileId)
        {
            application.ReviewedBy = adminProfileId;
            application.ReviewedAt = DateTime.UtcNow;
            application.UpdatedAt = DateTime.UtcNow;
        }

        private void AddDbNotification(ShipperApplication application, bool isApproved)
        {
            var userAccountId = application.UserProfile?.UserAccountId;
            if (userAccountId.HasValue)
            {
                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = userAccountId.Value,
                    Title = isApproved ? "Yêu cầu đăng ký tài xế đã được duyệt" : "Yêu cầu đăng ký tài xế bị từ chối",
                    Message = isApproved ? "Chúc mừng! Đơn đăng ký trở thành đối tác tài xế của bạn đã được phê duyệt thành công. Vui lòng đăng nhập lại để bắt đầu nhận đơn." :
                                           $"Đơn đăng ký trở thành đối tác tài xế của bạn đã bị từ chối. Lý do {application.RejectionReason}.",
                    NotificationType = NotificationType.System,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                };
                _notificationRepository.Add(notification);
            }
        }

        private async Task SendEmailNotificationAsync(ShipperApplication application, bool isApprove)
        {
            var email = application.UserProfile?.UserAccount?.Email;
            if (!string.IsNullOrEmpty(email))
            {
                string subject = isApprove ? "Thông báo duyệt hồ sơ đối tác tài xế - ShoppingFood" :
                                             "Thông báo kết quả hồ sơ đối tác tài xế - ShoppingFood";

                string body = isApprove
                    ? $"<p>Xin chào <strong>{application.UserProfile.FullName}</strong>,</p><p>Hồ sơ đăng ký đối tác tài xế của bạn đã được phê duyệt thành công trên hệ thống ShoppingFood.</p><p>Bạn đã có thể bắt đầu hoạt động và nhận đơn giao hành. Chúc bạn có những hành trình thuận lợi!</p>"
                    : $"<p>Xin chào <strong>{application.UserProfile.FullName}</strong>,</p><p>Đơn đăng ký đối tác tài xế của bạn chưa được phê duyệt.</p><p><strong>Lý do từ chối:</strong> {application.RejectionReason}</p><p>Vui lòng cập nhật lại thông tin chính xác và gửi lại yêu cầu duyệt.</p>";

                await _emailService.SendEmailAsync(email, subject, body);
            }
        }
    }
}
