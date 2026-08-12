using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class SuspendShipperHandler : IRequestHandler<SuspendShipperCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public SuspendShipperHandler(
            IUserRepository userRepository,
            IShipperProfileRepository shipperProfileRepository,
            INotificationRepository notificationRepository,
            IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _notificationRepository = notificationRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(SuspendShipperCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var authCheck = await CheckAuthorizationAsync(request.CurrentUserId);
                if (authCheck != null) return authCheck;

                var shipper = await GetShipperProfileAsync(request.ShipperId);
                if (shipper == null)
                    return ApiResponse.Failure(404, "Shipper profile not found.");

                SuspendShipper(shipper, request.DurationMinutes, request.Reason);

                AddSuspendedNotification(shipper, request.DurationMinutes, request.Reason);

                await _unitOfWork.SaveChangesAsync();
                return ApiResponse.Success(new { shipper.Id, Status = shipper.Status.ToString(), request.DurationMinutes }, "Shipper suspended successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("SuspendShipperHandler.Handle", ex);
                return ApiResponse.Failure(400, $"Internal server error: {ex.Message}");
            }
        }

        private async Task<ApiResponse?> CheckAuthorizationAsync(Guid? currentUserId)
        {
            if (!currentUserId.HasValue)
            {
                return ApiResponse.Failure(401, "Unauthorized access.");
            }

            return null;
        }
        private async Task<ShipperProfile?> GetShipperProfileAsync(Guid shipperId)
        {
            var shippers = await _shipperProfileRepository.GetAsync(
                predicate: s => s.Id == shipperId,
                include: q => q.Include(s => s.UserProfile),
                disableTracking: false
            );
            return shippers.FirstOrDefault();
        }

        private void SuspendShipper(ShipperProfile shipper, int durationMinutes, string reason)
        {
            shipper.IsOnline = false;
            shipper.SuspendedUntil = DateTime.UtcNow.AddMinutes(durationMinutes);
            shipper.SuspendedReason = reason;

            _shipperProfileRepository.Update(shipper);
        }

        private void AddSuspendedNotification(ShipperProfile shipper, int durationMinutes, string reason)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = shipper.Id,
                Title = "Tài khoản tạm dừng nhận đơn",
                Message = $"Bạn tạm thời không nhận được đề xuất đơn mới trong {durationMinutes} phút. Lý do: {reason}. Sau thời gian này hệ thống sẽ tự cho phép nhận đơn lại.",
                NotificationType = NotificationType.System,
                IsRead = false,
                CreateAt = DateTime.UtcNow,
            };
            _notificationRepository.Add(notification);
        }
    }
}
