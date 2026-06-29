using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class SuspendRestaurantHandler : IRequestHandler<SuspendRestaurantCommand, ApiResponse>
    {
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUserRepository _userRepository;
        private readonly IEmailService _emailservice;
        private readonly IUnitOfWork _unitOfWork;

        public SuspendRestaurantHandler(
            IRestaurantProfileRepository restaurantProfileRepository,
            INotificationRepository notificationRepository,
            IUserRepository userRepository,
            IEmailService emailService,
            IUnitOfWork unitOfWork)
        {
            _restaurantProfileRepository = restaurantProfileRepository;
            _notificationRepository = notificationRepository;
            _userRepository = userRepository;
            _emailservice = emailService;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(SuspendRestaurantCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var admins = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile)
            );
            var admin = admins.FirstOrDefault();
            if (admin == null || admin.Profile.Role != Domain.Enums.UserRole.Admin)
                return ApiResponse.Failure(403, "Forbidden. Only Admin can perform this action.");

            var restaurants = await _restaurantProfileRepository.GetAsync(
                predicate: r => r.Id == request.RestaurantId,
                include: q => q.Include(r => r.Owner).ThenInclude(o => o.UserAccount)
                );
            var restaurant = restaurants.FirstOrDefault();
            if (restaurant == null)
                return ApiResponse.Failure(404, "Restaurant not found.");
            
            if (restaurant.Owner == null || restaurant.Owner.UserAccount == null)
                return ApiResponse.Failure(400, "Restaurant owner data is incomplete.");

            if (request.IsSuspended)
            {
                if (restaurant.Status == Domain.Enums.RestaurantStatus.Suspended)
                    return ApiResponse.Failure(400, "Restaurant is already suspended.");
                
                restaurant.Status = Domain.Enums.RestaurantStatus.Suspended;
                var message = $"Nhà hàng của bạn đã bị khóa do vi phạm. Lý do: {request.Reason ?? "Vi phạm chính sách"}.";
                AddNotification(restaurant.Owner!.UserAccountId, message);

                if(restaurant.Owner?.UserAccount?.Email != null)
                {
                    SendEmail(restaurant.Owner.UserAccount.Email, message);
                }
            }
            else
            {
                if (restaurant.Status == Domain.Enums.RestaurantStatus.Active)
                    return ApiResponse.Failure(400, "Restaurant is already active.");
                
                restaurant.Status = Domain.Enums.RestaurantStatus.Active;
                var message = "Nhà hàng của bạn đã được mở khóa và có thể hoạt động trở lại. Chúc bạn buôn bán thuận lợi.";
                AddNotification(restaurant.Owner!.UserAccountId, message);

                if(restaurant.Owner?.UserAccount?.Email != null)
                {
                    SendEmail(restaurant.Owner.UserAccount.Email, message);
                }
            }

            _restaurantProfileRepository.Update(restaurant);
            var result = await _unitOfWork.SaveChangesAsync();

            if(result > 0)
            {
                return ApiResponse.Success(null, request.IsSuspended ? "Restaurant suspended successfully." : "Restaurant unsuspended successfully.");
            }
            return ApiResponse.Failure(400, "Failed to update restaurant status.");

        }

        private void AddNotification(Guid userId , string message)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = "Tài khoản bị đình chỉ",
                Message = message,
                NotificationType = Domain.Enums.NotificationType.System,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            };
            _notificationRepository.Add(notification);
        }

        private void SendEmail(string toEmail, string message)
        {
            _ = _emailservice.SendEmailAsync(toEmail, "Thông báo Đình chỉ hoạt động", message);
        }
    }
}
