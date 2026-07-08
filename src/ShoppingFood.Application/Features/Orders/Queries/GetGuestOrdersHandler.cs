using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Dto.Order;
using ShoppingFood.Repository.Interfaces;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetGuestOrdersHandler : IRequestHandler<GetGuestOrdersQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;

        public GetGuestOrdersHandler(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        public async Task<ApiResponse> Handle(GetGuestOrdersQuery request, CancellationToken cancellationToken)
        {
            var orders = await _orderRepository.GetAsync(
                predicate: o => o.GuestUserId == request.GuestUserId,
                include: q => q.Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Restaurant),
                orderBy: q => q.OrderByDescending(o => o.CreatedAt),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true);

            var orderDtos = orders.Select(o =>
            {
                var restaurant = o.Items.FirstOrDefault()?.Product?.Restaurant;
                return new OrderSummaryDto
                {
                    Id = o.Id,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status.ToString(),
                    PaymentMethod = o.PaymentMethod.ToString(),
                    PaymentStatus = o.PaymentStatus.ToString(),
                    CreatedAt = o.CreatedAt,
                    CanCancel = o.Status == OrderStatus.Pending || o.Status == OrderStatus.Confirmed,
                    CanMessageSeller = false, // Guests cannot chat
                    RestaurantId = restaurant?.Id,
                    RestaurantName = restaurant?.RestaurantName,
                    PaymentSessionId = o.PaymentSessionId
                };
            }).ToList();

            return ApiResponse.Success(orderDtos);
        }
    }
}
