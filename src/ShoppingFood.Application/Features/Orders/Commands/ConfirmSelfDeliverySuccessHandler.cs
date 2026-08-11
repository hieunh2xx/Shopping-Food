using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Application.Services;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class ConfirmSelfDeliverySuccessHandler : IRequestHandler<ConfirmSelfDeliverySuccessCommand, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPaymentSettlementService _paymentSettlementService;
        private readonly INotificationRepository _notificationRepository;
        private readonly ILoyaltyPointRepository _loyaltyPointRepository;
        private readonly ILoyaltyPointHistoryRepository _loyaltyPointHistoryRepository;
        private readonly IMemberTierConfigRepository _memberTierConfigRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly ChatSessionCloseService _chatSessionCloseService;

        public ConfirmSelfDeliverySuccessHandler(
            IOrderRepository orderRepository,
            IUnitOfWork unitOfWork,
            IPaymentSettlementService paymentSettlementService,
            INotificationRepository notificationRepository,
            ILoyaltyPointRepository loyaltyPointRepository,
            ILoyaltyPointHistoryRepository loyaltyPointHistoryRepository,
            IMemberTierConfigRepository memberTierConfigRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            ChatSessionCloseService chatSessionCloseService)
        {
            _orderRepository = orderRepository;
            _unitOfWork = unitOfWork;
            _paymentSettlementService = paymentSettlementService;
            _notificationRepository = notificationRepository;
            _loyaltyPointRepository = loyaltyPointRepository;
            _loyaltyPointHistoryRepository = loyaltyPointHistoryRepository;
            _memberTierConfigRepository = memberTierConfigRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _chatSessionCloseService = chatSessionCloseService;
        }

        public async Task<ApiResponse> Handle(ConfirmSelfDeliverySuccessCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(403, "Unauthorized");

                var orders = await _orderRepository.GetAsync(
                    predicate: o => o.Id == request.OrderId,
                    include: q => q.Include(o => o.Items).ThenInclude(i => i.Product),
                    disableTracking: false
                );
                var order = orders.FirstOrDefault();

                if (order == null)
                    return ApiResponse.Failure(404, "Order not found.");

                // Validate seller ownership
                var sellerRestaurants = await _restaurantProfileRepository.GetAsync(
                    predicate: r => r.Owner.UserAccountId == request.CurrentUserId.Value,
                    disableTracking: false
                );
                var restaurant = sellerRestaurants.FirstOrDefault();
                if (restaurant == null)
                    return ApiResponse.Failure(403, "You do not own any restaurants.");

                var isAuthorized = VerifyOrderOwnership(order, restaurant.Id);
                if (!isAuthorized)
                    return ApiResponse.Failure(403, "This order contains items that are not from your restaurant.");

                if (order.Status != OrderStatus.Shipping && order.Status != OrderStatus.WaitingForShipper)
                    return ApiResponse.Failure(400, $"Invalid order status for completing self-delivery. Current status: {order.Status}");

                if (order.ShipperId.HasValue)
                    return ApiResponse.Failure(400, "This order has a shipper assigned. Self-delivery confirmation is not allowed.");

                order.Status = OrderStatus.Delivered;
                order.UpdatedAt = DateTime.UtcNow;
                _orderRepository.Update(order);

                if (order.UserAccountId.HasValue)
                    await AccumulateLoyaltyPointsAsync(order);

                await _paymentSettlementService.SettleSelfDeliveryOrderAsync(order);

                AddDeliveryNotification(order, restaurant.RestaurantName);

                await _unitOfWork.SaveChangesAsync();

                // Đóng session chat sau khi giao (cửa sổ 24h vẫn mở)
                await _chatSessionCloseService.CloseSessionsForDeliveredOrderIfExpiredAsync(order.Id, order.UpdatedAt);

                return ApiResponse.Success(new { order.Id, Status = order.Status.ToString() }, "Order self-delivered successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("ConfirmSelfDeliverySuccessHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private bool VerifyOrderOwnership(Order order, Guid restaurantId)
        {
            if (order.Items == null || !order.Items.Any()) return false;
            foreach (var item in order.Items)
            {
                if (item.Product == null || item.Product.RestaurantId != restaurantId) return false;
            }
            return true;
        }

        private async Task AccumulateLoyaltyPointsAsync(Order order)
        {
            if (!order.UserAccountId.HasValue) return;

            var userId = order.UserAccountId.Value;
            var basisAmount = order.TotalAmount > 0
                ? order.TotalAmount
                : order.ItemsSubtotal + order.ShippingFee;
            var pointEarned = (int)(basisAmount / 10000m);
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

        private void AddDeliveryNotification(Order order, string restaurantName)
        {
            if (order.UserAccountId.HasValue)
            {
                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = order.UserAccountId.Value,
                    Title = "Giao hàng thành công",
                    Message = $"Đơn hàng của bạn đã được giao thành công bởi nhà hàng '{restaurantName}'. Chúc bạn ngon miệng!",
                    NotificationType = NotificationType.Delivery,
                    TargetId = order.Id,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                };
                _notificationRepository.Add(notification);
            }
        }
    }
}
