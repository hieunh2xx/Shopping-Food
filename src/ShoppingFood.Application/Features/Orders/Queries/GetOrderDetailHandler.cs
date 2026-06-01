using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Context;
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
    public class GetOrderDetailHandler : IRequestHandler<GetOrderDetailQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;

        public GetOrderDetailHandler(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        public async Task<ApiResponse> Handle(GetOrderDetailQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var orders = await _orderRepository.GetAsync(
                    predicate: o => o.Id == request.OrderId,
                    include: q => q.Include(o => o.Items),
                    disableTracking: true
                    );

                var order = orders.FirstOrDefault();
                if(order == null)
                    return ApiResponse.Failure(404, "Order not found");

                if (order.UserAccountId.HasValue)
                {
                    if(!request.CurrentUserId.HasValue || order.UserAccountId.Value != request.CurrentUserId.Value)
                        return ApiResponse.Failure(403, "You do not have permission to view this order");
                }

                var dto = MapToOrderDetailDto(order);
                return ApiResponse.Success(dto, "Order details retrieved successfully");
            }
            catch (Exception ex) 
            {
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private OrderDetailDto MapToOrderDetailDto(Order order)
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
                Items = order.Items.Select(i => new OrderItemDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId ?? Guid.Empty,
                    ItemName = i.ItemName,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    TotalPrice = i.TotalPrice
                }).ToList()
            };
        }
    }
}
