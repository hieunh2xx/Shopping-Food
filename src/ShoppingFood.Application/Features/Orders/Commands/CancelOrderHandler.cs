using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ShoppingFood.Application.Services;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class CancelOrderHandler : IRequestHandler<CancelOrderCommand, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IPaymentSettlementService _paymentSettlementService;
        private readonly INotificationRepository _notificationRepository;
        private readonly IChatSessionRepository _chatSessionRepository;
        private readonly ChatSessionCloseService _chatSessionCloseService;
        private readonly IUnitOfWork _unitOfWork;

        public CancelOrderHandler(
            IOrderRepository orderRepository,
            IPaymentSettlementService paymentSettlementService,
            INotificationRepository notificationRepository,
            IChatSessionRepository chatSessionRepository,
            ChatSessionCloseService chatSessionCloseService,
            IUnitOfWork unitOfWork) 
        {
            _orderRepository = orderRepository;
            _paymentSettlementService = paymentSettlementService;
            _notificationRepository = notificationRepository;
            _chatSessionRepository = chatSessionRepository;
            _chatSessionCloseService = chatSessionCloseService;
            _unitOfWork = unitOfWork;
        }
        public async Task<ApiResponse> Handle(CancelOrderCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var orders = await _orderRepository.GetAsync(
                    predicate: o => o.Id == request.OrderId,
                    include: q => q.Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Restaurant).ThenInclude(r => r.Owner),
                    disableTracking: false);
                var order = orders.FirstOrDefault();
                if(order == null)
                    return ApiResponse.Failure(404, "Order not found");

                if(order.Status != OrderStatus.Pending)
                    return ApiResponse.Failure(400, "Chỉ hủy được khi người bán chưa xác nhận đơn. Sau khi xác nhận, vui lòng nhắn tin người bán để yêu cầu hủy.");

                if (order.UserAccountId.HasValue)
                {
                    if(!request.CurrentUserId.HasValue || order.UserAccountId.Value != request.CurrentUserId.Value)
                        return ApiResponse.Failure(403, "You are not authorized to cancel this order");
                }
                else if (order.GuestUserId.HasValue)
                {
                    if(!request.GuestUserId.HasValue || order.GuestUserId.Value != request.GuestUserId.Value)
                        return ApiResponse.Failure(403, "You are not authorized to cancel this order");
                }
                else 
                    return ApiResponse.Failure(400, "Invalid order data");

                order.Status = OrderStatus.Cancelled;
                order.RejectReason = "[Customer Cancel] Khách hàng hủy đơn trước khi người bán xác nhận.";
                order.UpdatedAt = DateTime.UtcNow;

                await _paymentSettlementService.ProcessRefundAsync(order);

                _orderRepository.Update(order);
                await _unitOfWork.SaveChangesAsync();

                // Đóng session chat liên quan ngay khi đơn bị hủy
                await _chatSessionCloseService.CloseSessionsForCancelledOrderAsync(order.Id);

                var restaurant = order.Items.FirstOrDefault()?.Product?.Restaurant;
                if (restaurant != null)
                {
                    var notification = new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = restaurant.Owner.UserAccountId,
                        Title = "Đơn hàng đã bị hủy",
                        Message = $"Đơn #{Common.OrderDisplayHelper.ShortId(order.Id)} đã bị khách hàng hủy. Bạn không cần chuẩn bị món cho đơn này nữa.",
                        NotificationType = NotificationType.System,
                        TargetId = order.Id,
                        IsRead = false,
                        CreateAt = DateTime.UtcNow
                    };
                    _notificationRepository.Add(notification);
                    await _unitOfWork.SaveChangesAsync();
                }

                return ApiResponse.Success(null,"Order cancelled successfully");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("CancelOrderHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}
