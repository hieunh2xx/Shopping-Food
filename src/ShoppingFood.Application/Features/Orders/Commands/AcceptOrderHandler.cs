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

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class AcceptOrderHandler : IRequestHandler<AcceptOrderCommand, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationPushService _notificationPushService;
        private readonly IUnitOfWork _unitOfWork;

        public AcceptOrderHandler(
            IOrderRepository orderRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            INotificationRepository notificationRepository,
            INotificationPushService notificationPushService,
            IUnitOfWork unitOfWork
            ) 
        {
            _orderRepository = orderRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _notificationRepository = notificationRepository;
            _notificationPushService = notificationPushService;
            _unitOfWork = unitOfWork;
        }
        public async Task<ApiResponse> Handle(AcceptOrderCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if(!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var orders = await _orderRepository.GetAsync(
                    predicate: o => o.Id == request.OrderId,
                    include: q => q.Include(o => o.Items).ThenInclude(i => i.Product),
                    disableTracking: false
                    );
                var order = orders.FirstOrDefault();
                if( order == null ) return ApiResponse.Failure(404, "Order not found.");

                if(order.Status != OrderStatus.Pending) return ApiResponse.Failure(400, "Only pending orders can be accepted.");

                var sellerRestaurants = await _restaurantProfileRepository.GetAsync(
                    predicate: r => r.Owner.UserAccountId == request.CurrentUserId.Value,
                    disableTracking: true
                    );
                var restaurant = sellerRestaurants.FirstOrDefault();
                if (restaurant == null) return ApiResponse.Failure(403, "You do not own any restaurants on the system.");

                var isAuthorized = VerifyOrderOwnership(order, restaurant.Id);
                if (!isAuthorized) return ApiResponse.Failure(403, "This order contains dishes that are not from your restaurant.");

                order.Status = OrderStatus.Confirmed;
                order.UpdatedAt = DateTime.UtcNow;

                _orderRepository.Update(order);

                if (order.UserAccountId.HasValue)
                {
                    var notification = new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = order.UserAccountId.Value,
                        Title = "Đơn hàng đã được xác nhận",
                        Message = $"Nhà hàng đã xác nhận đơn #{order.Id.ToString()[..8]}. Bạn không thể tự hủy — nhắn tin người bán nếu cần hủy.",
                        NotificationType = NotificationType.Order,
                        TargetId = order.Id,
                        IsRead = false,
                        CreateAt = DateTime.UtcNow
                    };
                    _notificationRepository.Add(notification);
                    await _unitOfWork.SaveChangesAsync();

                    // Remove manual push service call since Interceptor handles it
                }
                else
                {
                    await _unitOfWork.SaveChangesAsync();
                }

                return ApiResponse.Success(null, "Accept order successfully");

            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("AcceptOrderHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private bool VerifyOrderOwnership(Order order, Guid sellerRestaurantId)
        {
            if (order.Items == null || !order.Items.Any())
                return false;

            foreach (var item in order.Items)
            {
                if (item.Product == null || item.Product.RestaurantId != sellerRestaurantId)
                    return false;
            }
            return true;
        }
    }
}
