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
    public class RejectOrderHandler : IRequestHandler<RejectOrderCommand, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public RejectOrderHandler(
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
        public async Task<ApiResponse> Handle(RejectOrderCommand request, CancellationToken cancellationToken)
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

                if (order.Status != OrderStatus.Pending)
                    return ApiResponse.Failure(400, "Only pending orders can be rejected");

                var sellerRestaurants = await _restaurantProfileRepository.GetAsync(
                    predicate: r => r.Owner.UserAccountId == request.CurrentUserId.Value,
                    disableTracking: true
                    );
                var restaurant = sellerRestaurants.FirstOrDefault();
                if (restaurant == null)
                    return ApiResponse.Failure(403, "You do not own any restaurants on the system.");

                var isAuthorized = VerifyOrderOwnership(order, restaurant.Id);
                if (!isAuthorized)
                    return ApiResponse.Failure(403, "This order contains dishes that are not from your restaurant.");

                order.Status = OrderStatus.Cancelled;
                order.RejectReason = request.RejectReason;
                order.UpdatedAt = DateTime.UtcNow;

                _orderRepository.Update(order);
                await _unitOfWork.SaveChangesAsync();

                if (order.UserAccountId.HasValue)
                {
                    var notification = new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = order.UserAccountId.Value,
                        Title = "Đơn hàng đã bị từ chối",
                        Message = $"Đơn hàng #{order.Id.ToString().Substring(0, 8)} của bạn đã bị từ chối bởi cửa hàng. Lý do: {request.RejectReason}",
                        NotificationType = NotificationType.System,
                        IsRead = false,
                        CreateAt = DateTime.UtcNow
                    };
                    _notificationRepository.Add(notification);
                    await _unitOfWork.SaveChangesAsync();
                }

                return ApiResponse.Success(null, "Order rejected successfully");
            }
            catch (Exception ex) 
            {
                await _unitOfWork.LogErrorAsync("RejectOrderHandler.Handle", ex);
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
