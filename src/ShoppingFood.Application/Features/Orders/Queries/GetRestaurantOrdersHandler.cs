using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Common;
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

                // 2. Build predicate (Filter: order id / OTP short code / customer / phone / address / shipper name)
                var filter = request.Filter?.Trim();
                var hasFilter = !string.IsNullOrWhiteSpace(filter);
                var filterLower = hasFilter ? filter!.ToLowerInvariant() : null;

                Expression<Func<Order, bool>> predicate = o =>
                    o.Items.Any(i => i.Product != null && i.Product.RestaurantId == restaurant.Id)
                    && !(o.PaymentMethod != PaymentMethod.COD && o.PaymentStatus == PaymentStatus.Pending)
                    && (!request.Status.HasValue || o.Status == request.Status.Value)
                    && (!hasFilter ||
                        o.Id.ToString().ToLower().Contains(filterLower!) ||
                        (o.ContactName != null && o.ContactName.ToLower().Contains(filterLower!)) ||
                        (o.ContactPhone != null && o.ContactPhone.ToLower().Contains(filterLower!)) ||
                        (o.DeliveryAddress != null && o.DeliveryAddress.ToLower().Contains(filterLower!)) ||
                        (o.Note != null && o.Note.ToLower().Contains(filterLower!)) ||
                        (o.Shipper != null && o.Shipper.UserProfile != null &&
                         o.Shipper.UserProfile.FullName != null &&
                         o.Shipper.UserProfile.FullName.ToLower().Contains(filterLower!)));

                var total = await _orderRepository.GetCountAsync(predicate);

                // 3. Fetch orders placed at this restaurant
                var orders = await _orderRepository.GetAsync(
                    predicate: predicate,
                    orderBy: q => q.OrderByDescending(o => o.CreatedAt),
                    include: q => q.Include(o => o.Items).ThenInclude(i => i.Product)
                                   .Include(o => o.AppliedDiscount)
                                   .Include(o => o.Shipper).ThenInclude(s => s.UserProfile).ThenInclude(p => p.UserAccount),
                    skip: request.Skip,
                    take: request.Take,
                    disableTracking: true
                );

                // 4. Map to DTO
                var dtos = orders.Select(o =>
                {
                    var itemsSum = o.Items?.Where(i => !i.IsGift).Sum(i => i.TotalPrice) ?? 0;
                    var displaySubtotal = itemsSum > 0 ? itemsSum : o.ItemsSubtotal;
                    var (voucherAmount, tierDiscountAmount) = OrderPricingHelper.ResolveDisplayedDiscounts(o, displaySubtotal);
                    return new OrderDetailDto
                {
                    Id = o.Id,
                    UserAccountId = o.UserAccountId,
                    GuestUserId = o.GuestUserId,
                    ShipperId = o.ShipperId,
                    ShipperName = o.Shipper?.UserProfile?.FullName,
                    ShipperPhone = o.Shipper?.UserProfile?.UserAccount?.Phone,
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
                    DiscountCode = o.AppliedDiscount?.Code,
                    ShippingFee = o.ShippingFee,
                    ItemsSubtotal = displaySubtotal,
                    DiscountAmount = voucherAmount,
                    TierDiscountAmount = tierDiscountAmount,
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
                };
                }).ToList();

                // 5. Attach batch pickup codes + readable bag labels (full Shipping set at restaurant)
                var allShippingAtRestaurant = await _orderRepository.GetAsync(
                    predicate: o =>
                        o.Status == OrderStatus.Shipping &&
                        o.ShipperId.HasValue &&
                        o.Items.Any(i => i.Product != null && i.Product.RestaurantId == restaurant.Id),
                    include: q => q.Include(o => o.Shipper).ThenInclude(s => s.UserProfile).ThenInclude(p => p.UserAccount),
                    disableTracking: true
                );

                var batchGroups = allShippingAtRestaurant
                    .GroupBy(o => o.ShipperId!.Value)
                    .Where(g => g.Count() >= 2)
                    .ToList();

                foreach (var group in batchGroups)
                {
                    var ordered = group.OrderBy(o => o.Id).ToList();
                    var batchOrderIds = ordered.Select(o => o.Id).ToList();
                    var code = BatchPickupCodeHelper.Compute(group.Key, restaurant.Id, batchOrderIds);
                    var labels = ordered.Select(o => new BatchOrderLabelDto
                    {
                        OrderId = o.Id,
                        ShortCode = o.Id.ToString("N")[..8].ToUpperInvariant(),
                        ContactName = string.IsNullOrWhiteSpace(o.ContactName) ? "Khách" : o.ContactName
                    }).ToList();
                    var shipperName = ordered.First().Shipper?.UserProfile?.FullName;
                    var shipperPhone = ordered.First().Shipper?.UserProfile?.UserAccount?.Phone;

                    foreach (var orderId in batchOrderIds)
                    {
                        var dto = dtos.FirstOrDefault(d => d.Id == orderId);
                        if (dto == null) continue;
                        dto.BatchPickupCode = code;
                        dto.BatchOrderIds = batchOrderIds;
                        dto.BatchOrderLabels = labels;
                        dto.ShipperName ??= shipperName;
                        dto.ShipperPhone ??= shipperPhone;
                    }
                }

                return ApiResponse.Success(dtos, "Restaurant orders retrieved successfully.", total);
            }
            catch (Exception ex)
            {
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}
