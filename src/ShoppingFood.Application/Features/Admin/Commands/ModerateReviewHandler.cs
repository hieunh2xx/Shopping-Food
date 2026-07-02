using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class ModerateReviewHandler : IRequestHandler<ModerateReviewCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IProductReviewRepository _productReviewRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly ISystemReportRepository _systemReportRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ModerateReviewHandler(
            IUserRepository userRepository,
            IProductReviewRepository productReviewRepository,
            INotificationRepository notificationRepository,
            ISystemReportRepository systemReportRepository,
            IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _productReviewRepository = productReviewRepository;
            _notificationRepository = notificationRepository;
            _systemReportRepository = systemReportRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ModerateReviewCommand request, CancellationToken cancellationToken)
        {
            if(!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );
            var userProfile = users.FirstOrDefault()?.Profile;
            if(userProfile == null || userProfile.Role != Domain.Enums.UserRole.Admin)
                return ApiResponse.Failure(403, "Forbidden.");

            var reports = await _systemReportRepository.GetAsync(
                predicate: r => r.Id == request.ReportId &&
                                r.TargetType == Domain.Enums.ReportTargetType.Review,
                include: q => q.Include(r => r.Reporter),
                disableTracking: false
                );
            var report = reports.FirstOrDefault();
            if(report == null)
                return ApiResponse.Failure(404, "Report not found.");

            if(report.Status != Domain.Enums.ReportStatus.Pending)
                return ApiResponse.Failure(400, "Report has already been processed.");

            if (request.IsApproved)
            {
                if (report.TargetId.HasValue)
                {
                    var reviews = await _productReviewRepository.GetAsync(
                        predicate: rv => rv.Id == report.TargetId.Value,
                        disableTracking: false
                        );
                    var review = reviews.FirstOrDefault();
                    if(review != null)
                    {
                        review.Comment = null;
                        review.SellerReply = null;
                        review.SellerRepliedAt = null;
                        _productReviewRepository.Update(review);
                    }
                }
                report.Status = Domain.Enums.ReportStatus.Resolved;
                NotifyReviewOwner(report);
            }
            else
            {
                report.Status = Domain.Enums.ReportStatus.Dismissed;
            }

            report.Content = string.IsNullOrEmpty(request.AdminNote)
                ? report.Content
                : $"{report.Content}\n[Admin note: {request.AdminNote}]";
            report.UpdatedAt = DateTime.UtcNow;

            _systemReportRepository.Update(report);
            await _unitOfWork.SaveChangesAsync();

            var message = request.IsApproved
                ? "Review has been removed successfully."
                : "Report has been dismissed.";
            return ApiResponse.Success(null, message);
        }

        private void NotifyReviewOwner(SystemReport report)
        {
            var reporterUserAccountId = report.Reporter?.UserAccountId;
            if (!reporterUserAccountId.HasValue) return;

            _notificationRepository.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = reporterUserAccountId.Value,
                Title = "Báo cáo bình luận đã được xử lý",
                Message = "Báo cáo của bạn đã được xem xét. Bình luận vi phạm đã bị gỡ bỏ.",
                NotificationType = Domain.Enums.NotificationType.System,
                IsRead = false,
                CreateAt = DateTime.UtcNow,
            });
        }
    }
}
