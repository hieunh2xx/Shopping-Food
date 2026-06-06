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
    public class SellerCancelOrderHandler : IRequestHandler<SellerCancelOrderCommand, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IUnitOfWork _unitOfWork;

        public SellerCancelOrderHandler(
            IOrderRepository orderRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            IUnitOfWork unitOfWork)
        {
            _orderRepository = orderRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
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

                var allowedStatuses = new[] { OrderStatus.Confirmed, OrderStatus.Preparing, OrderStatus.WaitingForDriver };
                if (!allowedStatuses.Contains(order.Status))
                    return ApiResponse.Failure(400, "Only orders that are Confirmed, Preparing, or Waiting for Driver can be cancelled due to incident.");

                var sellerRestaurant = await _restaurantProfileRepository.GetAsync(
                    predicate: r => r.Owner.UserAccountId == request.CurrentUserId.Value,
                    disableTracking: true
                    );
                var restaurant = sellerRestaurant.FirstOrDefault();
                if (restaurant == null)
                    return ApiResponse.Failure(403, "You do not own any restaurants on the system.");

                var isAuthorized = VerifyOrderOwnerShip(order, restaurant.Id);
                if (!isAuthorized)
                    return ApiResponse.Failure(403, "This order contains dishes that are not from your restaurant.");

                order.Status = OrderStatus.Cancelled;
                order.RejectReason = $"[Seller Incident] {request.Reason}";
                order.UpdatedAt = DateTime.UtcNow;

                _orderRepository.Update(order);
                await _unitOfWork.SaveChangesAsync();
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
