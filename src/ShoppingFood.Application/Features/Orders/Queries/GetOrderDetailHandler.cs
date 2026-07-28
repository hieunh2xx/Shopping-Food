using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Order;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetOrderDetailHandler : IRequestHandler<GetOrderDetailQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IChatSessionRepository _chatSessionRepository;
        private readonly IPaymentSessionRepository _paymentSessionRepository;

        private static readonly OrderStatus[] MessageableStatuses =
        {
            OrderStatus.Confirmed,
            OrderStatus.Preparing,
            OrderStatus.WaitingForShipper,
            OrderStatus.Shipping,
            OrderStatus.Delivered
        };

        public GetOrderDetailHandler(
            IOrderRepository orderRepository,
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            IShipperProfileRepository shipperProfileRepository,
            IChatSessionRepository chatSessionRepository,
            IPaymentSessionRepository paymentSessionRepository)
        {
            _orderRepository = orderRepository;
            _userRepository = userRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _chatSessionRepository = chatSessionRepository;
            _paymentSessionRepository = paymentSessionRepository;
        }

        public async Task<ApiResponse> Handle(GetOrderDetailQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var orders = await _orderRepository.GetAsync(
                    predicate: o => (request.OrderId.HasValue && o.Id == request.OrderId.Value)
                                 || (!string.IsNullOrEmpty(request.OrderCode) && o.Id.ToString().StartsWith(request.OrderCode.ToLower())),
                    include: q => q.Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Restaurant).Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Images).Include(o => o.AppliedDiscount),
                    disableTracking: true
                );

                var order = orders.FirstOrDefault();
                if (order == null)
                    return ApiResponse.Failure(404, "Order not found");

                if (order.UserAccountId.HasValue)
                {
                    if (!request.CurrentUserId.HasValue)
                    {
                        return ApiResponse.Failure(401, "Unauthorized");
                    }

                    var isAuthorized = await IsUserAuthorizedForOrder(order, request.CurrentUserId.Value);
                    if (!isAuthorized)
                    {
                        return ApiResponse.Failure(403, "You do not have permission to view this order");
                    }
                }

                var chatSessionList = await _chatSessionRepository.GetAsync(
                    predicate: s => s.OrderId == order.Id,
                    disableTracking: true
                );
                var chatSession = chatSessionList.OrderByDescending(s => s.CreatedAt).FirstOrDefault();

                var paymentSessionList = await _paymentSessionRepository.GetAsync(
                    predicate: p => p.OrderId == order.Id,
                    disableTracking: true
                );
                var paymentSession = paymentSessionList.OrderByDescending(p => p.CreatedAt).FirstOrDefault();

                var restaurant = order.Items.FirstOrDefault()?.Product?.Restaurant;
                if (restaurant == null)
                {
                    // Fallback just in case Include wasn't fully loaded
                    var products = order.Items.Select(i => i.Product).Where(p => p != null).ToList();
                    restaurant = products.FirstOrDefault()?.Restaurant;
                }

                var dto = MapToOrderDetailDto(order, chatSession, paymentSession, restaurant);
                return ApiResponse.Success(dto, "Order details retrieved successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task<bool> IsUserAuthorizedForOrder(Order order, Guid currentUserId)
        {
            // 1. Is Customer?
            if (order.UserAccountId.HasValue && order.UserAccountId.Value == currentUserId)
                return true;

            // Get user with Profile
            var userList = await _userRepository.GetAsync(
                predicate: u => u.Id == currentUserId,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );
            var user = userList.FirstOrDefault();
            if (user == null || user.Profile == null)
                return false;

            var role = user.Profile.Role;

            // 2. Is Admin or Coordinator?
            if (role == UserRole.Admin || role == UserRole.Coordinator)
                return true;

            // 3. Is Seller?
            if (role == UserRole.Seller || role == UserRole.Mall)
            {
                var sellerRestaurants = await _restaurantProfileRepository.GetAsync(
                    predicate: r => r.Owner.UserAccountId == currentUserId,
                    disableTracking: true
                );
                var restaurant = sellerRestaurants.FirstOrDefault();
                if (restaurant != null && order.Items.Any(i => i.Product != null && i.Product.RestaurantId == restaurant.Id))
                {
                    return true;
                }
            }

            // 4. Is Shipper?
            if (role == UserRole.Shipper)
            {
                var shipperList = await _shipperProfileRepository.GetAsync(
                    predicate: s => s.UserProfile.UserAccountId == currentUserId,
                    disableTracking: true
                );
                var shipper = shipperList.FirstOrDefault();
                if (shipper != null && order.ShipperId.HasValue && order.ShipperId.Value == shipper.Id)
                {
                    return true;
                }
            }

            return false;
        }

        private OrderDetailDto MapToOrderDetailDto(Order order, Domain.Models.ChatSession? chatSession, Domain.Models.PaymentSession? paymentSession, RestaurantProfile? restaurant)
        {
            return new OrderDetailDto
            {
                Id = order.Id,
                UserAccountId = order.UserAccountId,
                GuestUserId = order.GuestUserId,
                TotalAmount = order.TotalAmount,
                DeliveryAddress = order.DeliveryAddress,
                ContactName = order.ContactName,
                ContactPhone = order.ContactPhone,
                Note = order.Note,
                PaymentMethod = order.PaymentMethod.ToString(),
                Status = order.Status.ToString(),
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt,
                CanCancel = order.Status == OrderStatus.Pending,
                CanMessageSeller = order.UserAccountId.HasValue && MessageableStatuses.Contains(order.Status),
                RestaurantId = restaurant?.Id,
                RestaurantName = restaurant?.RestaurantName,
                OrderChatSessionId = chatSession?.Id,
                OrderChatSessionStatus = chatSession?.Status.ToString(),
                PaymentStatus = paymentSession?.Status.ToString() ?? "",
                PaymentSessionId = paymentSession?.Id,
                DiscountCode = order.AppliedDiscount?.Code,
                Items = order.Items.Select(i => new OrderItemDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId ?? Guid.Empty,
                    ItemName = i.ItemName,
                    ProductImage = i.Product != null && i.Product.Images != null 
                        ? (i.Product.Images.FirstOrDefault(img => img.IsPrimary)?.ImageUrl ?? i.Product.Images.FirstOrDefault()?.ImageUrl)
                        : null,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    TotalPrice = i.TotalPrice
                }).ToList()
            };
        }
    }
}
