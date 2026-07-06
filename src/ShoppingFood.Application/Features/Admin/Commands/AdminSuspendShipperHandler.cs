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

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class AdminSuspendShipperHandler : IRequestHandler<AdminSuspendShipperCommand, ApiResponse>
    {
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IEmailService _emailService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IUserRepository _userRepository;

        public AdminSuspendShipperHandler(
            IShipperProfileRepository shipperProfileRepository,
            INotificationRepository notificationRepository,
            IEmailService emailService,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _shipperProfileRepository = shipperProfileRepository;
            _notificationRepository = notificationRepository;
            _emailService = emailService;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(AdminSuspendShipperCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );
            var currentUser = users.FirstOrDefault();
            if (currentUser == null || currentUser.Profile?.Role != UserRole.Admin)
                return ApiResponse.Failure(403, "Access denied. Only admins can toggle shipper account status.");

            var shippers = await _shipperProfileRepository.GetAsync(
                predicate: s => s.Id == request.ShipperId,
                include: q => q.Include(s => s.UserProfile).ThenInclude(p => p.UserAccount),
                disableTracking: false
            );
            var shipper = shippers.FirstOrDefault();

            if (shipper == null)
                return ApiResponse.Failure(404, "Shipper not found.");

            if (request.IsLocked)
            {
                shipper.IsOnline = false;
                shipper.SuspendedUntil = DateTime.MaxValue;
                shipper.SuspendedReason = "Tài khoản bị khóa do điểm uy tín quá thấp. Vui lòng liên hệ Admin để đào tạo lại.";
            }
            else
            {
                shipper.SuspendedUntil = null;
                shipper.SuspendedReason = null;
            }

            _shipperProfileRepository.Update(shipper);

            // Add notification
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = shipper.UserProfile.UserAccountId,
                Title = request.IsLocked ? "Tài khoản tài xế bị khóa" : "Tài khoản tài xế được mở khóa",
                Message = request.IsLocked
                    ? "Tài khoản của bạn đã bị khóa do điểm uy tín quá thấp. Vui lòng liên hệ Admin để tham gia đào tạo lại nghiệp vụ."
                    : "Tài khoản của bạn đã được mở khóa. Bạn có thể bắt đầu hoạt động lại.",
                NotificationType = NotificationType.System,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            };
            _notificationRepository.Add(notification);

            // Send email
            var email = shipper.UserProfile?.UserAccount?.Email;
            if (!string.IsNullOrEmpty(email))
            {
                string subject = request.IsLocked ? "Thông báo khóa tài khoản tài xế - ShoppingFood" :
                                                "Thông báo mở khóa tài khoản tài xế - ShoppingFood";

                string body = request.IsLocked
                    ? $"<p>Xin chào <strong>{shipper.UserProfile.FullName}</strong>,</p><p>Tài khoản đối tác tài xế của bạn đã bị khóa tạm thời do điểm uy tín quá thấp.</p><p>Vui lòng liên hệ với Quản trị viên (Admin) để đăng ký lớp đào tạo lại nghiệp vụ.</p>"
                    : $"<p>Xin chào <strong>{shipper.UserProfile.FullName}</strong>,</p><p>Tài khoản đối tác tài xế của bạn đã được mở khóa. Bạn có thể đăng nhập vào ứng dụng và tiếp tục hoạt động.</p><p>Chúc bạn có những chuyến xe an toàn và hiệu quả!</p>";

                try
                {
                    await _emailService.SendEmailAsync(email, subject, body);
                }
                catch (Exception emailEx)
                {
                    await _unitOfWork.LogErrorAsync("AdminSuspendShipperHandler.SendEmail", emailEx);
                }
            }

            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(null, request.IsLocked ? "Khóa tài khoản tài xế thành công." : "Mở khóa tài khoản tài xế thành công.");
        }
    }
}
