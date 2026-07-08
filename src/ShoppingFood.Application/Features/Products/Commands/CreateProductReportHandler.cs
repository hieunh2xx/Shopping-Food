using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Support;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class CreateProductReportHandler : IRequestHandler<CreateProductReportCommand, ApiResponse>
    {
        private readonly ISystemReportRepository _systemReportRepository;
        private readonly IProductRepository _productRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public CreateProductReportHandler(
            ISystemReportRepository systemReportRepository,
            IProductRepository productRepository,
            IUserRepository userRepository,
            INotificationRepository notificationRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper
            ) 
        {
            _systemReportRepository = systemReportRepository;
            _productRepository = productRepository;
            _userRepository = userRepository;
            _notificationRepository = notificationRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }
        public async Task<ApiResponse> Handle(CreateProductReportCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (request.CurrentUserId == null)
                    return ApiResponse.Failure(401, "Unauthorized access.");

                var product = await _productRepository.GetByIdAsync(request.ProductId);
                if (product == null)
                    return ApiResponse.Failure(404, "This product cannot be found");

                var user = await _userRepository.GetAsync(
                    predicate: u => u.Id == request.CurrentUserId,
                    include: q => q.Include(u => u.Profile)
                    );

                var userProfile = user.FirstOrDefault()?.Profile;
                if (userProfile == null)
                    return ApiResponse.Failure(404, "User profile not found");

                var report = _mapper.Map<SystemReport>(request);
                report.Id = Guid.NewGuid();
                report.ReporterId = userProfile.Id;
                report.TargetType = ReportTargetType.Product;
                report.Status = ReportStatus.Pending;
                report.CreatedAt = DateTime.UtcNow;
                report.UpdatedAt = DateTime.UtcNow;
                
                _systemReportRepository.Add( report );
                await NotifyAdminAsync(product.ItemName);
                await _unitOfWork.SaveChangesAsync();

                var dto = _mapper.Map<SystemReportDto>(report);

                return ApiResponse.Success(dto, "Your report has been submitted and is pending review.");
            }
            catch (Exception ex) 
            {
                await _unitOfWork.LogErrorAsync("CreateProductReportHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task NotifyAdminAsync(string productName)
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
                    Title = "Báo cáo sản phẩm mới",
                    Message = $"Có báo cáo mới về sản phẩm '{productName}' đang chờ xử lý.",
                    NotificationType = Domain.Enums.NotificationType.System,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                });
            }
        }
    }
}
