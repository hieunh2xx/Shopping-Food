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
                        include: q => q.Include(rv => rv.UserProfile),
                        disableTracking: false
                        );
                    var review = reviews.FirstOrDefault();
                    if(review != null)
                    {
                        review.Comment = "[Bình luận đã bị gỡ bỏ do vi phạm]";
                        review.SellerReply = null;
                        review.SellerRepliedAt = null;
                        _productReviewRepository.Update(review);

                        if (review.UserProfile != null)
                        {
                            _notificationRepository.Add(new Notification
                            {
                                Id = Guid.NewGuid(),
                                UserId = review.UserProfile.UserAccountId,
                                Title = "Bình luận vi phạm tiêu chuẩn",
                                Message = "Một bình luận của bạn đã bị quản trị viên gỡ bỏ do vi phạm quy định cộng đồng.",
                                NotificationType = Domain.Enums.NotificationType.System,
                                IsRead = false,
                                CreateAt = DateTime.UtcNow,
                            });
                        }
                    }
                }
                report.Status = Domain.Enums.ReportStatus.Resolved;
                NotifyReporter(report, true);
            }
            else
            {
                report.Status = Domain.Enums.ReportStatus.Dismissed;
                NotifyReporter(report, false);
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

        private void NotifyReporter(SystemReport report, bool isApproved)
        {
            var reporterUserAccountId = report.Reporter?.UserAccountId;
            if (!reporterUserAccountId.HasValue) return;

            var title = isApproved ? "Báo cáo bình luận đã được xử lý" : "Báo cáo bình luận bị từ chối";
            var message = isApproved 
                ? "Báo cáo của bạn đã được xem xét. Bình luận vi phạm đã bị gỡ bỏ." 
                : "Báo cáo của bạn đã được xem xét. Quản trị viên xác định bình luận không vi phạm tiêu chuẩn cộng đồng.";

            _notificationRepository.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = reporterUserAccountId.Value,
                Title = title,
                Message = message,
                NotificationType = Domain.Enums.NotificationType.System,
                IsRead = false,
                CreateAt = DateTime.UtcNow,
            });
        }
    }
}
