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
            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == currentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );
            var user = users.FirstOrDefault();
            if (user == null || (user.Profile?.Role != UserRole.Coordinator && user.Profile?.Role != UserRole.Admin))
            {
                return ApiResponse.Failure(403, "Access denied. Only coordinators and admins can suspend shippers.");
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
                Title = "Tài khoản bị tạm đình chỉ nhận đơn",
                Message = $"Tài khoản hoạt động shipper của bạn đã bị tạm dừng nhận đề xuất giao đơn trong {durationMinutes} phút. Lý do : {reason}",
                NotificationType = NotificationType.System,
                IsRead = false,
                CreateAt = DateTime.UtcNow,
            };
            _notificationRepository.Add(notification);
        }
    }
}
