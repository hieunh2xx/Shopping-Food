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
    public class PrepareOrderHandler : IRequestHandler<PrepareOrderCommand, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public PrepareOrderHandler(
            IOrderRepository orderRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            INotificationRepository notificationRepository,
            IUnitOfWork unitOfWork) 
        {
            _orderRepository = orderRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _notificationRepository = notificationRepository;
            _unitOfWork = unitOfWork;
        }
        public async Task<ApiResponse> Handle(PrepareOrderCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(403, "Unauthorized.");

                var orders = await _orderRepository.GetAsync(
                    predicate: o => o.Id == request.OrderId,
                    include: q => q.Include(o => o.Items).ThenInclude(i => i.Product),
                    disableTracking: false
                    );
                var order = orders.FirstOrDefault();
                if (order == null)
                    return ApiResponse.Failure(404, "Order not found");

                if (order.Status != OrderStatus.Confirmed)
                    return ApiResponse.Failure(400, "Only confirmed orders can be updated to preparing.");

                var sellerRestaurants = await _restaurantProfileRepository.GetAsync(
                    predicate: r => r.Owner.UserAccountId == request.CurrentUserId.Value,
                    disableTracking: false
                    );

                var restaurant = sellerRestaurants.FirstOrDefault();
                if (restaurant == null)
                    return ApiResponse.Failure(403, "You do not own any restaurants on the system.");

                var isAuthorized = VerifyOrderOwnerShip(order, restaurant.Id);
                if (!isAuthorized)
                    return ApiResponse.Failure(403, "This order contains dishes that are not from your restaurant.");

                order.Status = OrderStatus.Preparing;
                order.UpdatedAt = DateTime.UtcNow;

                _orderRepository.Update(order);
                
                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = order.UserAccountId.Value,
                    Title = "Đơn hàng đang được chuẩn bị",
                    Message = $"Nhà hàng đang chuẩn bị món cho đơn #{Common.OrderDisplayHelper.ShortId(order.Id)}. Bạn sẽ được thông báo khi đơn sẵn sàng giao.",
                    NotificationType = NotificationType.Order,
                    TargetId = order.Id,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                };
                _notificationRepository.Add(notification);

                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(null, "Order status updated to Preparing successfully.");
            }
            catch (Exception ex) 
            {
                await _unitOfWork.LogErrorAsync("PrepareOrderHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private bool VerifyOrderOwnerShip(Order order, Guid id)
        {
            if(order.Items == null || !order.Items.Any()) return false;

            foreach (var item in order.Items) 
            {
                if (item.Product == null || item.Product.RestaurantId != id) return false;
            }
            return true;
        }
    }
}
