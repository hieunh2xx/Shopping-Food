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
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class ResolveIncidentHandler : IRequestHandler<ResolveIncidentCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IShipperReputationHistoryRepository _reputationHistoryRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ResolveIncidentHandler(
            IUserRepository userRepository,
            IOrderRepository orderRepository,
            IShipperProfileRepository shipperProfileRepository,
            INotificationRepository notificationRepository,
            IShipperReputationHistoryRepository reputationHistoryRepository,
            IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _orderRepository = orderRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _notificationRepository = notificationRepository;
            _reputationHistoryRepository = reputationHistoryRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ResolveIncidentCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var authCheck = await CheckAuthorizationAsync(request.CurrentUserId);
                if (authCheck != null) return authCheck;

                var order = await GetOrderIncidentAsync(request.OrderId);
                if (order == null)
                    return ApiResponse.Failure(404, "Order not found.");

                if (order.RejectReason != null && order.RejectReason.Contains("Resolved:"))
                    return ApiResponse.Failure(400, "This delivery incident has already been resolved.");

                if(request.ResolutionType == "ShipperFault")
                {
                    var penaltyCheck = await ApplyShipperPenaltyAsync(order, request.PenaltyScore);
                    if(penaltyCheck != null) return penaltyCheck;
                }

                UpdateOrderIncidentStatus(order, request.ResolutionType, request.Notes);

                await AddNotificationToShipper(order, request.ResolutionType, request.Notes);

                await _unitOfWork.SaveChangesAsync();
                return ApiResponse.Success(new { order.Id, RejectReason = order.RejectReason }, "Incident resolved successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("ResolveIncidentHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task<ApiResponse?> CheckAuthorizationAsync(Guid? currentUserId)
        {
            if (!currentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");



            return null;
        }

        private async Task<Order?> GetOrderIncidentAsync(Guid orderId)
        {
            var oders = await _orderRepository.GetAsync(
                predicate: o => o.Id == orderId,
                disableTracking: false
                );
            var order = oders.FirstOrDefault();
            if (order != null && (order.Status != OrderStatus.Cancelled || !order.RejectReason.StartsWith("[Delivery Failed]")))
                return null;

            return order;
        }

        private async Task<ApiResponse?> ApplyShipperPenaltyAsync(Order order, double penaltyScore)
        {
            if (!order.ShipperId.HasValue)
                return ApiResponse.Failure(400, "Cannot apply shipper penalty because no shipper is assigned to this order.");

            var shippers = await _shipperProfileRepository.GetAsync(
                predicate: s => s.Id == order.ShipperId.Value,
                include: q => q.Include(s => s.UserProfile),
                disableTracking: false
                );
            var shipper = shippers.FirstOrDefault();
            if (shipper == null)
                return ApiResponse.Failure(404, "Shipper profile not found to apply penalty.");

            var oldScore = shipper.ReputationScore;
            shipper.ReputationScore = Math.Max(0, shipper.ReputationScore - penaltyScore);
            shipper.UpdatedAt = DateTime.UtcNow;
            _shipperProfileRepository.Update(shipper);

            var actualChange = shipper.ReputationScore - oldScore;
            if (actualChange != 0)
            {
                var history = new ShipperReputationHistory
                {
                    Id = Guid.NewGuid(),
                    ShipperProfileId = shipper.Id,
                    OrderId = order.Id,
                    PointChange = actualChange,
                    Reason = $"Sự cố đơn hàng: Lỗi do tài xế.",
                    CreatedAt = DateTime.UtcNow
                };
                _reputationHistoryRepository.Add(history);
            }

            return null;
        }

        private void UpdateOrderIncidentStatus(Order order, string resolutionType, string notes)
        {
            order.RejectReason = $"[Delivery Failed] Resolved: {resolutionType}. Note: {notes}";
            order.UpdatedAt = DateTime.UtcNow;
            _orderRepository.Update(order);
        }

        private async Task AddNotificationToShipper(Order order, string resolutionType, string notes)
        {
            if (!order.ShipperId.HasValue) return;

            var shippers = await _shipperProfileRepository.GetAsync(
                predicate: s => s.Id == order.ShipperId.Value,
                include: q => q.Include(s => s.UserProfile),
                disableTracking: true
                );
            var shipper = shippers.FirstOrDefault();
            if (shipper == null) return;

            var message = resolutionType == "ShipperFault"
                ? $"Sự cố đơn hàng '{order.Id}' được kết luận: Lỗi do tài xế. Bạn đã bị trừ điểm uy tín. Lý do: {notes}"
                : $"Sự cố đơn hàng '{order.Id}' được kết luận: {resolutionType}. Bạn không bị trừ điểm uy tín. Ghi chú: {notes}";

            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = shipper.UserProfile.UserAccountId,
                Title = "Kết quả phân giải sự cố đơn hàng",
                Message = message,
                NotificationType = NotificationType.Order,
                TargetId = order.Id,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            };
            _notificationRepository.Add(notification);
        }
    }
}
