using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Order;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetOrderHistoryHandler : IRequestHandler<GetOrderHistoryQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;

        public GetOrderHistoryHandler(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        public async Task<ApiResponse> Handle(GetOrderHistoryQuery request, CancellationToken cancellationToken)
        {
            try
            {
                if(!request.CurrentUserId.HasValue && !request.GuestUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                IReadOnlyList<Order> orders;

                if (request.CurrentUserId.HasValue)
                {
                    orders = await _orderRepository.GetAsync(
                        predicate: o => o.UserAccountId == request.CurrentUserId.Value,
                        orderBy: q => q.OrderByDescending(o => o.CreatedAt),
                        skip: request.Skip,
                        take: request.Take,
                        disableTracking: true
                    );
                }
                else
                {
                    orders = await _orderRepository.GetAsync(
                        predicate: o => o.GuestUserId == request.GuestUserId.Value,
                        orderBy: q => q.OrderByDescending(o => o.CreatedAt),
                        skip: request.Skip,
                        take: request.Take,
                        disableTracking: true
                    );
                }

                var dto = orders.Select(o => new OrderSummaryDto{
                    Id = o.Id,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status.ToString(),
                    PaymentMethod = o.PaymentMethod.ToString(),
                    CreatedAt = o.CreatedAt
                }).ToList();

                return ApiResponse.Success(dto, "Order history retrieved successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");

            }
        }
    }
}
