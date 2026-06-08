using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using ShoppingFood.Dto.Order;
using ShoppingFood.Domain.Models;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetOrderDetailsHandler : IRequestHandler<GetOrderDetailsQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;

        public GetOrderDetailsHandler(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        public async Task<ApiResponse> Handle(GetOrderDetailsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                // 1. Lấy đơn hàng chi tiết cùng danh sách sản phẩm
                var orders = await _orderRepository.GetAsync(
                    predicate: o => o.Id == request.OrderId,
                    include: q => q.Include(o => o.Items),
                    disableTracking: true
                );
                
                var order = orders.FirstOrDefault();
                if (order == null)
                {
                    return ApiResponse.Failure(404, "Không tìm thấy đơn hàng.");
                }

                // 2. Kiểm tra quyền sở hữu đối với Member
                if (order.UserAccountId.HasValue)
                {
                    if (!request.CurrentUserId.HasValue || order.UserAccountId.Value != request.CurrentUserId.Value)
                    {
                        return ApiResponse.Failure(403, "Bạn không có quyền xem thông tin đơn hàng này.");
                    }
                }

                // 3. Map dữ liệu sang DTO qua helper method
                var dto = MapToOrderDetailDto(order);

                return ApiResponse.Success(dto, "Lấy thông tin đơn hàng chi tiết thành công.");
            }
            catch (Exception ex)
            {
                return ApiResponse.Failure(500, $"Có lỗi xảy ra: {ex.Message}");
            }
        }

        private OrderDetailDto MapToOrderDetailDto(Order order)
        {
            return new OrderDetailDto
            {
                Id = order.Id,
                UserAccountId = order.UserAccountId,
                GuestUserId = order.GuestUserId,
                ShipperId = order.ShipperId,
                TotalAmount = order.TotalAmount,
                DeliveryAddress = order.DeliveryAddress,
                ContactName = order.ContactName,
                ContactPhone = order.ContactPhone,
                Note = order.Note,
                Status = order.Status.ToString(),
                PaymentMethod = order.PaymentMethod.ToString(),
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
