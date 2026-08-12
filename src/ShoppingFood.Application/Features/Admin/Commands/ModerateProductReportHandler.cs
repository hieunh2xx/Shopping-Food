using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class ModerateProductReportHandler : IRequestHandler<ModerateProductReportCommand, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly ISystemReportRepository _systemReportRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ModerateProductReportHandler(
            IProductRepository productRepository,
            INotificationRepository notificationRepository,
            ISystemReportRepository systemReportRepository,
            IUnitOfWork unitOfWork)
        {
            _productRepository = productRepository;
            _notificationRepository = notificationRepository;
            _systemReportRepository = systemReportRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ModerateProductReportCommand request, CancellationToken cancellationToken)
        {
            if(!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var reports = await _systemReportRepository.GetAsync(
                predicate: r => r.Id == request.ReportId &&
                                r.TargetType == Domain.Enums.ReportTargetType.Product,
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
                    var products = await _productRepository.GetAsync(
                        predicate: p => p.Id == report.TargetId.Value,
                        include: q => q.Include(p => p.Restaurant).ThenInclude(r => r.Owner),
                        disableTracking: false
                        );
                    var product = products.FirstOrDefault();
                    if(product != null)
                    {
                        if (request.HideProduct)
                        {
                            product.IsHidden = true;
                            _productRepository.Update(product);
                        }

                        // Notify seller
                        if (product.Restaurant?.Owner?.Id != null)
                        {
                            string sellerMessage = request.HideProduct 
                                ? $"Món «{product.ItemName}» đã bị ẩn do vi phạm chính sách. Lý do: {request.AdminNote}. Liên hệ hỗ trợ nếu bạn cần khiếu nại."
                                : $"Món «{product.ItemName}» nhận báo cáo vi phạm. Quản trị viên nhắc: {request.AdminNote}. Vui lòng chỉnh sửa để tránh bị ẩn.";

                            _notificationRepository.Add(new Notification
                            {
                                Id = Guid.NewGuid(),
                                UserId = product.Restaurant.Owner.Id,
                                Title = request.HideProduct ? "Sản phẩm bị ẩn" : "Cảnh báo vi phạm sản phẩm",
                                Message = sellerMessage,
                                NotificationType = Domain.Enums.NotificationType.System,
                                IsRead = false,
                                CreateAt = DateTime.UtcNow
                            });
                        }
                    }
                }
                report.Status = Domain.Enums.ReportStatus.Resolved;
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

            // Notify Customer (Reporter)
            string reporterMessage = request.IsApproved 
                ? $"Báo cáo sản phẩm của bạn đã được xử lý. Cảm ơn bạn đã góp phần giữ chất lượng nền tảng!{(string.IsNullOrEmpty(request.AdminNote) ? "" : $" Ghi chú: {request.AdminNote}")}" 
                : $"Báo cáo sản phẩm của bạn không được chấp nhận.{(string.IsNullOrEmpty(request.AdminNote) ? "" : $" Lý do: {request.AdminNote}")}";

            _notificationRepository.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = report.ReporterId,
                Title = "Kết quả báo cáo sản phẩm",
                Message = reporterMessage,
                NotificationType = Domain.Enums.NotificationType.System,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            });

            await _unitOfWork.SaveChangesAsync();

            var message = request.IsApproved
                ? (request.HideProduct ? "Product has been hidden and report resolved." : "Report has been resolved.")
                : "Report has been dismissed.";
            return ApiResponse.Success(null, message);
        }
    }
}
