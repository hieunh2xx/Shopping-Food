using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Application.Services;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class ConfirmDeliverySuccessHandler : IRequestHandler<ConfirmDeliverySuccessCommand, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILoyaltyPointRepository _loyaltyPointRepository;
        private readonly ILoyaltyPointHistoryRepository _loyaltyPointHistoryRepository;
        private readonly IMemberTierConfigRepository _memberTierConfigRepository;
        private readonly IShipperReputationHistoryRepository _reputationHistoryRepository;
        private readonly IPaymentSettlementService _paymentSettlementService;
        private readonly ChatSessionCloseService _chatSessionCloseService;
        private readonly IUnitOfWork _unitOfWork;

        public ConfirmDeliverySuccessHandler(
            IOrderRepository orderRepository,
            IShipperProfileRepository shipperProfileRepository,
            INotificationRepository notificationRepository,
            IUserRepository userRepository,
            ILoyaltyPointRepository loyaltyPointRepository, 
            ILoyaltyPointHistoryRepository loyaltyPointHistoryRepository,
            IMemberTierConfigRepository memberTierConfigRepository,
            IShipperReputationHistoryRepository reputationHistoryRepository,
            IPaymentSettlementService paymentSettlementService,
            ChatSessionCloseService chatSessionCloseService,
            IUnitOfWork unitOfWork)
        {
            _orderRepository = orderRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _notificationRepository = notificationRepository;
            _userRepository = userRepository;
            _loyaltyPointRepository = loyaltyPointRepository;
            _loyaltyPointHistoryRepository = loyaltyPointHistoryRepository;
            _memberTierConfigRepository = memberTierConfigRepository;
            _reputationHistoryRepository = reputationHistoryRepository;
            _paymentSettlementService = paymentSettlementService;
            _chatSessionCloseService = chatSessionCloseService;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ConfirmDeliverySuccessCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var shipperProfile = await GetActiveShipperProfileAsync(request.CurrentUserId.Value);
                if (shipperProfile == null)
                    return ApiResponse.Failure(403, "Forbidden. Only active shippers can perform this action.");

                if (!shipperProfile.IsOnline)
                    return ApiResponse.Failure(400, "Shippers must switch to online status to perform this action.");

                var order = await GetOrderAsync(request.OrderId);
                if (order == null)
                    return ApiResponse.Failure(404, "Order not found.");

                if (order.ShipperId != shipperProfile.Id)
                    return ApiResponse.Failure(403, "Forbidden. You are not assigned to this order.");

                if (order.Status != OrderStatus.Shipping)
                    return ApiResponse.Failure(400, $"Invalid order status for completing delivery. Current status: {order.Status}");

                order.Status = OrderStatus.Delivered;
                order.DeliveryProofImageUrl = request.DeliveryProofImageUrl;
                order.UpdatedAt = DateTime.UtcNow;
                _orderRepository.Update(order);

                if (order.UserAccountId.HasValue)
                    await AccumulateLoyaltyPointsAsync(order);

                // Reward 1 point for successful delivery
                var oldScore = shipperProfile.ReputationScore;
                shipperProfile.ReputationScore = Math.Min(100, shipperProfile.ReputationScore + 1);
                
                await _paymentSettlementService.SettleOrderOnDeliveryAsync(order, shipperProfile);

                shipperProfile.Latitude = request.Latitude;
                shipperProfile.Longitude = request.Longitude;
                shipperProfile.UpdatedAt = DateTime.UtcNow;
                _shipperProfileRepository.Update(shipperProfile);

                var actualChange = shipperProfile.ReputationScore - oldScore;
                if (actualChange > 0)
                {
                    _reputationHistoryRepository.Add(new ShipperReputationHistory
                    {
                        Id = Guid.NewGuid(),
                        ShipperProfileId = shipperProfile.Id,
                        OrderId = order.Id,
                        PointChange = actualChange,
                        Reason = "Giao hàng thành công",
                        CreatedAt = DateTime.UtcNow
                    });
                }

                AddDeliveryNotification(order, shipperProfile.UserProfile.FullName);

                await _unitOfWork.SaveChangesAsync();

                // Đóng session chat khi đơn đã giao (cửa sổ 24h vẫn mở, auto-close sau 24h)
                await _chatSessionCloseService.CloseSessionsForDeliveredOrderIfExpiredAsync(order.Id, order.UpdatedAt);

                return ApiResponse.Success(new {order.Id, Status = order.Status.ToString()}, "Order delivery successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("ConfirmDeliverySuccessHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task AccumulateLoyaltyPointsAsync(Order order)
        {
            if (!order.UserAccountId.HasValue) return;

            var userId = order.UserAccountId.Value;
            var basisAmount = order.TotalAmount > 0
                ? order.TotalAmount
                : order.ItemsSubtotal + order.ShippingFee;
            var pointEarned = (int)(basisAmount / 10000m);
            // Đơn giao thành công có giá trị > 0 luôn nhận tối thiểu 1 điểm
            if (pointEarned <= 0 && basisAmount > 0) pointEarned = 1;
            if (pointEarned <= 0) return;

            var orderIdToken = order.Id.ToString();
            var alreadyEarned = (await _loyaltyPointHistoryRepository.GetAsync(
                predicate: h =>
                    h.UserAccountId == userId
                    && h.TransactionType == PointTransactionType.EarnFromOrder
                    && h.Description.Contains(orderIdToken),
                disableTracking: true
            )).Any();
            if (alreadyEarned) return;

            var loyaltyPoints = (await _loyaltyPointRepository.GetAsync(
                predicate: lp => lp.UserAccountId == userId,
                disableTracking: false
            )).FirstOrDefault();

            bool isNew = false;
            if (loyaltyPoints == null)
            {
                loyaltyPoints = new LoyaltyPoint
                {
                    UserAccountId = userId,
                    PointsBalance = 0,
                    TotalEarnedPoints = 0,
                    Tier = MemberTier.Bronze,
                    UpdatedAt = DateTime.UtcNow,
                };
                isNew = true;
            }

            loyaltyPoints.PointsBalance += pointEarned;
            loyaltyPoints.TotalEarnedPoints += pointEarned;
            loyaltyPoints.UpdatedAt = DateTime.UtcNow;

            var tierConfigs = (await _memberTierConfigRepository.GetAllAsync())?.ToList()
                ?? new List<MemberTierConfig>();
            loyaltyPoints.Tier = DetermineMemberTier(loyaltyPoints.TotalEarnedPoints, tierConfigs);

            if (isNew)
            {
                _loyaltyPointRepository.Add(loyaltyPoints);
            }
            else
            {
                _loyaltyPointRepository.Update(loyaltyPoints);
            }

            var history = new LoyaltyPointHistory
            {
                Id = Guid.NewGuid(),
                UserAccountId = userId,
                Points = pointEarned,
                TransactionType = PointTransactionType.EarnFromOrder,
                Description = $"Tích lũy {pointEarned} điểm thưởng từ đơn hàng #{order.Id}",
                CreatedAt = DateTime.UtcNow
            };
            _loyaltyPointHistoryRepository.Add(history);

            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = "Tích lũy điểm thưởng thành công",
                Message = $"Chúc mừng! Bạn đã tích lũy thành công {pointEarned} điểm thưởng từ đơn hàng #{order.Id}. Hạng thành viên hiện tại: {loyaltyPoints.Tier.ToString()}.",
                NotificationType = NotificationType.Loyalty,
                TargetId = order.Id,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            };
            _notificationRepository.Add(notification);
        }

        private MemberTier DetermineMemberTier(int totalEarnedPoints, List<MemberTierConfig> tiers)
        {
            var diamondMin = tiers.FirstOrDefault(c => c.Tier == MemberTier.Diamond)?.MinPoints ?? 1000;
            var goldMin = tiers.FirstOrDefault(c => c.Tier == MemberTier.Gold)?.MinPoints ?? 500;
            var silverMin = tiers.FirstOrDefault(c => c.Tier == MemberTier.Silver)?.MinPoints ?? 100;

            if (totalEarnedPoints >= diamondMin) return MemberTier.Diamond;
            if (totalEarnedPoints >= goldMin) return MemberTier.Gold;
            if (totalEarnedPoints >= silverMin) return MemberTier.Silver;
            return MemberTier.Bronze;
        }


        private async Task<ShipperProfile?> GetActiveShipperProfileAsync(Guid userId)
        {
            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == userId,
                include: q => q.Include(u => u.Profile)
                );

            var userProfile = users.FirstOrDefault()?.Profile;
            if(userProfile == null || userProfile.Role != UserRole.Shipper)
                return null;

            var profiles = await _shipperProfileRepository.GetAsync(
                predicate: p => p.UserProfileId == userProfile.Id && p.Status == UserStatus.Active,
                include: q => q.Include(p => p.UserProfile),
                disableTracking: false
                );
            return profiles.FirstOrDefault();
        }

        private async Task<Order?> GetOrderAsync(Guid orderId)
        {
            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == orderId,
                disableTracking: false
                );
            return orders.FirstOrDefault();
        }

        private void AddDeliveryNotification(Order order, string shipperName)
        {
            if (order.UserAccountId.HasValue)
            {
                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = order.UserAccountId.Value,
                    Title = "Giao hàng thành công",
                    Message = $"Đơn hàng của bạn đã được giao thành công bởi tài xế '{shipperName}'. Chúc bạn ngon miệng!",
                    NotificationType = NotificationType.Delivery,
                    TargetId = order.Id,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                };
                _notificationRepository.Add( notification );
            }
        }
    }
}
