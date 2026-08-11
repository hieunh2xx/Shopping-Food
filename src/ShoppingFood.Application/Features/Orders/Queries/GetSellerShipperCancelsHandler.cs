using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetSellerShipperCancelsHandler : IRequestHandler<GetSellerShipperCancelsQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;

        public GetSellerShipperCancelsHandler(
            IOrderRepository orderRepository,
            IRestaurantProfileRepository restaurantProfileRepository)
        {
            _orderRepository = orderRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
        }

        public async Task<ApiResponse> Handle(GetSellerShipperCancelsQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var sellerRestaurants = await _restaurantProfileRepository.GetAsync(
                predicate: r => r.Owner.UserAccountId == request.CurrentUserId.Value,
                disableTracking: true
            );
            var restaurant = sellerRestaurants.FirstOrDefault();
            if (restaurant == null)
                return ApiResponse.Failure(403, "You do not own any restaurants on the system.");

            var days = request.Days <= 0 ? 30 : Math.Min(request.Days, 365);
            var since = DateTime.UtcNow.AddDays(-days);

            var orders = await _orderRepository.GetAsync(
                predicate: o =>
                    o.Items.Any(i => i.Product != null && i.Product.RestaurantId == restaurant.Id)
                    && o.Status == OrderStatus.Cancelled
                    && o.RejectReason != null
                    && o.RejectReason.StartsWith("[Delivery Failed]")
                    && o.UpdatedAt >= since,
                orderBy: q => q.OrderByDescending(o => o.UpdatedAt),
                include: q => q
                    .Include(o => o.Shipper).ThenInclude(s => s!.UserProfile)
                    .Include(o => o.Items).ThenInclude(i => i.Product),
                take: 200,
                disableTracking: true
            );

            static string StripReason(string? reason)
            {
                if (string.IsNullOrWhiteSpace(reason)) return string.Empty;
                var text = reason.Trim();
                if (text.StartsWith("[Delivery Failed]", StringComparison.OrdinalIgnoreCase))
                    text = text["[Delivery Failed]".Length..].Trim();
                return text;
            }

            static string ReasonLabel(string full)
            {
                var colon = full.IndexOf(':');
                return colon > 0 ? full[..colon].Trim() : full.Trim();
            }

            var items = orders.Select(o =>
            {
                var reason = StripReason(o.RejectReason);
                return new
                {
                    orderId = o.Id,
                    shortId = o.Id.ToString()[..8].ToUpperInvariant(),
                    cancelledAt = o.UpdatedAt,
                    totalAmount = o.TotalAmount,
                    contactName = o.ContactName,
                    deliveryAddress = o.DeliveryAddress,
                    shipperName = o.Shipper?.UserProfile?.FullName,
                    rejectReason = reason,
                    reasonLabel = ReasonLabel(reason)
                };
            }).ToList();

            var statsByReason = items
                .GroupBy(i => string.IsNullOrWhiteSpace(i.reasonLabel) ? "Không rõ" : i.reasonLabel)
                .Select(g => new { reason = g.Key, count = g.Count() })
                .OrderByDescending(x => x.count)
                .ToList();

            return ApiResponse.Success(new
            {
                days,
                total = items.Count,
                statsByReason,
                items
            }, "Seller shipper cancels retrieved.");
        }
    }
}
