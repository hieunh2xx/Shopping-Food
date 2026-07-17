using AutoMapper;
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
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class ApproveApplicationHandler : IRequestHandler<ApproveApplicationCommand, ApiResponse>
    {
        private readonly ISellerApplicationRepository _sellerApplicationRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IEmailService _emailService;
        private readonly INotificationRepository _notificationRepository;
        private readonly ShoppingFoodContext _dbContext;

        public ApproveApplicationHandler(
            ISellerApplicationRepository sellerApplicationRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IEmailService emailService,
            INotificationRepository notificationRepository,
            ShoppingFoodContext dbContext)
        {
            _sellerApplicationRepository = sellerApplicationRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _emailService = emailService;
            _notificationRepository = notificationRepository;
            _dbContext = dbContext;
        }

        public async Task<ApiResponse> Handle(ApproveApplicationCommand request, CancellationToken cancellationToken)
        {
            using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "User is unauthorized.");

                var adminProfile = await GetAdminProfileAsync(request.CurrentUserId.Value);
                if (adminProfile == null)
                    return ApiResponse.Failure(401, "User profile not found.");

                var applications = await _sellerApplicationRepository.GetAsync(
                    predicate: a => a.Id == request.ApplicationId,
                    include: q => q.Include(a => a.UserProfile).ThenInclude(p => p.UserAccount),
                    disableTracking: false
                );
                var application = applications.FirstOrDefault();

                if (application == null)
                    return ApiResponse.Failure(404, $"Seller application with Id: '{request.ApplicationId}' was not found.");

                if (application.Status != ApplicationStatus.Pending)
                    return ApiResponse.Failure(400, $"Seller application is already processed. Current status: {application.Status}");

                if (request.IsApproved)
                {
                    application.Status = ApplicationStatus.Approved;
                    
                    if (application.UserProfile != null)
                    {
                        if (application.Type == ApplicationType.UpgradeToMall)
                        {
                            application.UserProfile.Role = UserRole.Mall;
                        }
                        else
                        {
                            application.UserProfile.Role = UserRole.Seller;
                        }
                        application.UserProfile.UpdatedAt = DateTime.UtcNow;
                        _userRepository.Update(application.UserProfile.UserAccount); 
                    }

                    if (application.Type == ApplicationType.NewSeller)
                    {
                        var restaurant = CreateRestaurantProfileEntity(application);
                        _restaurantProfileRepository.Add(restaurant);
                    }
                }
                else
                {
                    application.Status = ApplicationStatus.Rejected;
                    application.RejectionReason = request.RejectionReason;
                }

                application.ReviewedBy = adminProfile.Id;
                application.ReviewedAt = DateTime.UtcNow;
                application.UpdatedAt = DateTime.UtcNow;

                
                AddDbNotification(application, request.IsApproved);

                await _unitOfWork.SaveChangesAsync();

                try 
                {
                    await SendEmailNotificationAsync(application, request.IsApproved);
                }
                catch (Exception emailEx)
                {
                    await _unitOfWork.LogErrorAsync("ApproveSellerApplicationHandler.SendEmail", emailEx);
                }

                await transaction.CommitAsync(cancellationToken);

                string statusMessage = request.IsApproved 
                    ? "Seller application has been approved and restaurant profile has been created."
                    : "Seller application has been rejected.";

                return ApiResponse.Success(null, statusMessage);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);

                await _unitOfWork.LogErrorAsync("ApproveApplicationHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred (transaction rolled back): {ex.Message}");
            }
        }

        private async Task<UserProfile?> GetAdminProfileAsync(Guid userId)
        {
            var adminUser = await _userRepository.GetAsync(
                predicate: u => u.Id == userId,
                include: q => q.Include(u => u.Profile)
            );
            var admin = adminUser.FirstOrDefault();
            return admin?.Profile;
        }

        private RestaurantProfile CreateRestaurantProfileEntity(SellerApplication application)
        {
            return new RestaurantProfile
            {
                Id = Guid.NewGuid(),
                SellerApplicationId = application.Id,
                OwnerId = application.UserProfileId,
                RestaurantName = application.BusinessName,
                Address = application.BusinessAddress,
                Phone = application.ContactInfo,
                Email = application.UserProfile.UserAccount?.Email ?? string.Empty,
                Status = RestaurantStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
        }

        private async Task SendEmailNotificationAsync(SellerApplication application, bool isApproved)
        {
            var sellerEmail = application.UserProfile?.UserAccount?.Email;
            if (!string.IsNullOrEmpty(sellerEmail))
            {
                bool isMall = application.Type == ApplicationType.UpgradeToMall;
                string subject = isApproved
                    ? (isMall ? "Yêu cầu nâng cấp lên ShoppingFood Mall đã được duyệt" : "Yêu cầu đăng ký làm đối tác cửa hàng đã được duyệt")
                    : (isMall ? "Yêu cầu nâng cấp lên ShoppingFood Mall đã bị từ chối" : "Yêu cầu đăng ký làm đối tác cửa hàng đã bị từ chối");

                string body = isApproved
                    ? (isMall ? $"<p>Xin chúc mừng,</p><p>Yêu cầu nâng cấp lên ShoppingFood Mall cho cửa hàng <strong>{application.BusinessName}</strong> đã được phê duyệt thành công.</p><p>Cửa hàng của bạn giờ đây đã có huy hiệu Mall và sẽ được ưu tiên hiển thị.</p>" : $"<p>Xin chúc mừng,</p><p>Yêu cầu đăng ký đối tác bán hàng cho cửa hàng <strong>{application.BusinessName}</strong> đã được phê duyệt thành công.</p><p>Hồ sơ cửa hàng của bạn đã được khởi tạo và bạn có thể bắt đầu đăng bán sản phẩm.</p>")
                    : (isMall ? $"<p>Xin chào,</p><p>Yêu cầu nâng cấp lên ShoppingFood Mall cho cửa hàng <strong>{application.BusinessName}</strong> đã bị từ chối phê duyệt.</p><p><strong>Lý do từ chối:</strong> {application.RejectionReason}</p>" : $"<p>Xin chào,</p><p>Yêu cầu đăng ký đối tác bán hàng cho cửa hàng <strong>{application.BusinessName}</strong> đã bị từ chối phê duyệt.</p><p><strong>Lý do từ chối:</strong> {application.RejectionReason}</p><p>Vui lòng cập nhật hồ sơ và gửi lại yêu cầu.</p>");

               
                await _emailService.SendEmailAsync(sellerEmail, subject, body);
            }
        }

        private void AddDbNotification(SellerApplication application, bool isApproved)
        {
            var userAccountId = application.UserProfile?.UserAccountId;
            if (userAccountId.HasValue)
            {
                bool isMall = application.Type == ApplicationType.UpgradeToMall;
                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = userAccountId.Value,
                    Title = isApproved 
                        ? (isMall ? "Nâng cấp Mall thành công" : "Yêu cầu đối tác đã được duyệt") 
                        : (isMall ? "Từ chối nâng cấp Mall" : "Yêu cầu đối tác bị từ chối"),
                    Message = isApproved
                        ? (isMall ? $"Yêu cầu nâng cấp lên Mall của cửa hàng '{application.BusinessName}' đã được duyệt." : $"Đơn đăng ký đối tác cửa hàng '{application.BusinessName}' của bạn đã được phê duyệt.")
                        : (isMall ? $"Yêu cầu nâng cấp lên Mall của cửa hàng '{application.BusinessName}' đã bị từ chối. Lý do: {application.RejectionReason}." : $"Đơn đăng ký đối tác cửa hàng '{application.BusinessName}' của bạn đã bị từ chối. Lý do: {application.RejectionReason}."),
                    NotificationType = NotificationType.System,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                };

                _notificationRepository.Add(notification);
            }
        }
    }
}
