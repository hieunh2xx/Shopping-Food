using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class SellerCancelOrderHandler : IRequestHandler<SellerCancelOrderCommand, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IPaymentSettlementService _paymentSettlementService;
        private readonly IUnitOfWork _unitOfWork;

        public SellerCancelOrderHandler(
            IOrderRepository orderRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            INotificationRepository notificationRepository,
            IPaymentSettlementService paymentSettlementService,
            IUnitOfWork unitOfWork)
        {
            _orderRepository = orderRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _notificationRepository = notificationRepository;
            _paymentSettlementService = paymentSettlementService;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(SellerCancelOrderCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var orders = await _orderRepository.GetAsync(
                    predicate: o => o.Id == request.OrderId,
                    include: q => q.Include(o => o.Items).ThenInclude(i => i.Product),
                    disableTracking: false
                );
                var order = orders.FirstOrDefault();
                if (order == null)
                    return ApiResponse.Failure(404, "Order not found");

                var allowedStatuses = new[] { OrderStatus.Confirmed, OrderStatus.Preparing, OrderStatus.WaitingForShipper };
                if (!allowedStatuses.Contains(order.Status))
                    return ApiResponse.Failure(400, "Only orders that are Confirmed, Preparing, or Waiting for Shipper can be cancelled due to incident.");

                var sellerRestaurant = await _restaurantProfileRepository.GetAsync(
                    predicate: r => r.Owner.UserAccountId == request.CurrentUserId.Value,
                    disableTracking: true
                );
                var restaurant = sellerRestaurant.FirstOrDefault();
                if (restaurant == null)
                    return ApiResponse.Failure(403, "You do not own any restaurants on the system.");

                if (!VerifyOrderOwnerShip(order, restaurant.Id))
                    return ApiResponse.Failure(403, "This order contains dishes that are not from your restaurant.");

                order.Status = OrderStatus.Cancelled;
                order.RejectReason = $"[Seller Incident] {request.Reason}";
                order.UpdatedAt = DateTime.UtcNow;

                await _paymentSettlementService.ProcessRefundAsync(order);

                _orderRepository.Update(order);
                await _unitOfWork.SaveChangesAsync();

                if (order.UserAccountId.HasValue)
                {
                    var shortId = order.Id.ToString()[..8].ToUpperInvariant();
                    var refundNote = order.PaymentStatus == PaymentStatus.Refunded
                        ? " Số tiền đã thanh toán online đã được hoàn vào ví của bạn."
                        : string.Empty;
                    _notificationRepository.Add(new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = order.UserAccountId.Value,
                        Title = "Đơn hàng đã bị hủy",
                        Message = $"Đơn hàng #{shortId} của bạn đã bị hủy bởi cửa hàng. Lý do: {request.Reason}.{refundNote}",
                        NotificationType = NotificationType.System,
                        TargetId = order.Id,
                        IsRead = false,
                        CreateAt = DateTime.UtcNow
                    });
                    await _unitOfWork.SaveChangesAsync();
                }

                return ApiResponse.Success(null, "Order cancelled successfully due to incident.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("SellerCancelOrderHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private bool VerifyOrderOwnerShip(Order order, Guid restaurantId)
        {
            if (order.Items == null || !order.Items.Any()) return false;
            foreach (var item in order.Items)
            {
                if (item.Product == null || item.Product.RestaurantId != restaurantId)
                    return false;
            }
            return true;
        }
    }
}
