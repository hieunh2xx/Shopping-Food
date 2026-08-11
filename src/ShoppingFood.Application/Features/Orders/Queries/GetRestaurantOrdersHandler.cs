using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Order;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetRestaurantOrdersHandler : IRequestHandler<GetRestaurantOrdersQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;

        public GetRestaurantOrdersHandler(
            IOrderRepository orderRepository,
            IRestaurantProfileRepository restaurantProfileRepository)
        {
            _orderRepository = orderRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
        }

        public async Task<ApiResponse> Handle(GetRestaurantOrdersQuery request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                {
                    return ApiResponse.Failure(401, "Unauthorized.");
                }

                // 1. Get restaurant owned by the seller
                var sellerRestaurants = await _restaurantProfileRepository.GetAsync(
                    predicate: r => r.Owner.UserAccountId == request.CurrentUserId.Value,
                    disableTracking: true
                );
                var restaurant = sellerRestaurants.FirstOrDefault();
                if (restaurant == null)
                {
                    return ApiResponse.Failure(403, "You do not own any restaurants on the system.");
                }

                // 2. Build predicate
                Expression<Func<Order, bool>> predicate = o => 
                    o.Items.Any(i => i.Product != null && i.Product.RestaurantId == restaurant.Id)
                    && !(o.PaymentMethod != PaymentMethod.COD && o.PaymentStatus == PaymentStatus.Pending)
                    && (!request.Status.HasValue || o.Status == request.Status.Value);

                var total = await _orderRepository.GetCountAsync(predicate);

                // 3. Fetch orders placed at this restaurant
                var orders = await _orderRepository.GetAsync(
                    predicate: predicate,
                    orderBy: q => q.OrderByDescending(o => o.CreatedAt),
                    include: q => q.Include(o => o.Items).ThenInclude(i => i.Product),
                    skip: request.Skip,
                    take: request.Take,
                    disableTracking: true
                );

                // 4. Map to DTO
                var dtos = orders.Select(o => new OrderDetailDto
                {
                    Id = o.Id,
                    UserAccountId = o.UserAccountId,
                    GuestUserId = o.GuestUserId,
                    ShipperId = o.ShipperId,
                    TotalAmount = o.TotalAmount,
                    DeliveryAddress = o.DeliveryAddress,
                    ContactName = o.ContactName,
                    ContactPhone = o.ContactPhone,
                    Note = o.Note,
                    Status = o.Status.ToString(),
                    PaymentMethod = o.PaymentMethod.ToString(),
                    CreatedAt = o.CreatedAt,
                    UpdatedAt = o.UpdatedAt,
                    RejectReason = o.RejectReason,
                    ShippingFee = o.ShippingFee,
                    ItemsSubtotal = o.ItemsSubtotal,
                    ShipperIncome = o.ShipperIncome,
                    ShipperBaseFeeAmount = o.ShipperBaseFeeAmount,
                    ShipperDistanceFeeAmount = o.ShipperDistanceFeeAmount,
                    ShipperPeakBonus = o.ShipperPeakBonus,
                    Items = o.Items.Select(i => new OrderItemDto
                    {
                        Id = i.Id,
                        ProductId = i.ProductId ?? Guid.Empty,
                        ItemName = i.ItemName,
                        Quantity = i.Quantity,
                        UnitPrice = i.IsGift ? 0 : i.UnitPrice,
                        TotalPrice = i.IsGift ? 0 : i.TotalPrice,
                        SelectedSize = i.SelectedSize,
                        SelectedToppings = i.SelectedToppings,
                        IsGift = i.IsGift,
                        BuyXGetYPromotionId = i.BuyXGetYPromotionId
                    }).ToList()
                }).ToList();

                return ApiResponse.Success(dtos, "Restaurant orders retrieved successfully.", total);
            }
            catch (Exception ex)
            {
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}
