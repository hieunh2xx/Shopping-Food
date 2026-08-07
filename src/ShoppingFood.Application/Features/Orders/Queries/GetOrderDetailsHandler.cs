using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using ShoppingFood.Dto.Order;
using ShoppingFood.Domain.Models;
using ShoppingFood.Domain.Enums;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetOrderDetailsHandler : IRequestHandler<GetOrderDetailsQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;

        public GetOrderDetailsHandler(
            IOrderRepository orderRepository,
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            IShipperProfileRepository shipperProfileRepository)
        {
            _orderRepository = orderRepository;
            _userRepository = userRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _shipperProfileRepository = shipperProfileRepository;
        }

        public async Task<ApiResponse> Handle(GetOrderDetailsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                // 1. Lấy đơn hàng chi tiết cùng danh sách sản phẩm
                var orders = await _orderRepository.GetAsync(
                    predicate: o => o.Id == request.OrderId,
                    include: q => q.Include(o => o.Items).ThenInclude(i => i.Product),
                    disableTracking: true
                );
                
                var order = orders.FirstOrDefault();
                if (order == null)
                {
                    return ApiResponse.Failure(404, "Không tìm thấy đơn hàng.");
                }

                // 2. Kiểm tra quyền sở hữu
                if (order.UserAccountId.HasValue)
                {
                    if (!request.CurrentUserId.HasValue)
                    {
                        return ApiResponse.Failure(401, "Chưa xác thực.");
                    }

                    var isAuthorized = await IsUserAuthorizedForOrder(order, request.CurrentUserId.Value);
                    if (!isAuthorized)
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
                    TotalPrice = i.TotalPrice,
                    SelectedSize = i.SelectedSize,
                    SelectedToppings = i.SelectedToppings
                }).ToList()
            };
        }
    }
}
