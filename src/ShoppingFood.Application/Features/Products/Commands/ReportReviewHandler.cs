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

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class ReportReviewHandler : IRequestHandler<ReportReviewCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly ISystemReportRepository _systemReportRepository;
        private readonly IProductReviewRepository _productReviewRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ReportReviewHandler(
            IUserRepository userRepository,
            ISystemReportRepository systemReportRepository,
            IProductReviewRepository productReviewRepository,
            INotificationRepository notificationRepository,
            IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _systemReportRepository = systemReportRepository;
            _productReviewRepository = productReviewRepository;
            _notificationRepository = notificationRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ReportReviewCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null)
                return ApiResponse.Failure(401, "User profile not found.");

            var review = await _productReviewRepository.GetByIdAsync(request.ReviewId);
            if (review == null)
                return ApiResponse.Failure(404, "Review not found.");

            if (review.UserProfileId == userProfile.Id)
                return ApiResponse.Failure(400, "You cannot report your own review.");

            var alreadyReported = await _systemReportRepository.ExistsAsync(
                r => r.TargetType == ReportTargetType.Review &&
                     r.TargetId == request.ReviewId &&
                     r.ReporterId == userProfile.Id
            );
            if (alreadyReported)
                return ApiResponse.Failure(400, "You have already reported this review.");

            var report = new SystemReport
            {
                Id = Guid.NewGuid(),
                ReporterId = userProfile.Id,
                TargetId = request.ReviewId,
                TargetType = ReportTargetType.Review,
                Title = request.Reason,
                Content = request.Description,
                Status = ReportStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _systemReportRepository.Add(report);

            // Thông báo cho tất cả Admin — review report cần Admin kiểm duyệt (BR41)
            await NotifyAdminsAsync(request.ReviewId);

            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(null, "Review reported successfully.");
        }

        private async Task NotifyAdminsAsync(Guid reviewId)
        {
            var admins = await _userRepository.GetAsync(
                predicate: u => u.Profile != null && u.Profile.Role == UserRole.Admin,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );

            foreach (var admin in admins)
            {
                _notificationRepository.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = admin.Id,
                    Title = "Bình luận bị báo cáo vi phạm",
                    Message = $"Một bình luận vừa bị báo cáo và đang chờ bạn kiểm duyệt.",
                    NotificationType = NotificationType.System,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                });
            }
        }
    }
}
