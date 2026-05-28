using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Order;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetMyOrdersHandler : IRequestHandler<GetMyOrdersQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IUserRepository _userRepository;

        public GetMyOrdersHandler(IOrderRepository orderRepository, IUserRepository userRepository)
        {
            _orderRepository = orderRepository;
            _userRepository = userRepository;
        }

        public async Task<ApiResponse> Handle(GetMyOrdersQuery request, CancellationToken cancellationToken)
        {
            var userList = await _userRepository.GetAsync(u => u.UserName == request.Username);
            var user = userList.FirstOrDefault();

            if (user == null)
            {
                return ApiResponse.Failure(404, "User not found.");
            }

            var orders = await _orderRepository.GetAsync(
                predicate: o => o.UserAccountId == user.Id,
                orderBy: q => q.OrderByDescending(o => o.CreatedAt)
            );

            var orderDtos = orders.Select(o => new OrderSummaryDto
            {
                Id = o.Id,
                TotalAmount = o.TotalAmount,
                Status = o.Status.ToString(),
                PaymentMethod = o.PaymentMethod.ToString(),
                CreatedAt = o.CreatedAt
            }).ToList();

            return ApiResponse.Success(orderDtos, "Orders retrieved successfully.");
        }
    }
}
