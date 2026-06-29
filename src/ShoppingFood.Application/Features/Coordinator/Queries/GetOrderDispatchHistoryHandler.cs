using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Dto.Order;
using ShoppingFood.Repository.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Queries
{
    public class GetOrderDispatchHistoryHandler : IRequestHandler<GetOrderDispatchHistoryQuery, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IOrderDispatchHistoryRepository _orderDispatchHistoryRepository;
        private readonly IMapper _mapper;

        public GetOrderDispatchHistoryHandler(
            IUserRepository userRepository,
            IOrderDispatchHistoryRepository orderDispatchHistoryRepository,
            IMapper mapper)
        {
            _userRepository = userRepository;
            _orderDispatchHistoryRepository = orderDispatchHistoryRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetOrderDispatchHistoryQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );
            var user = users.FirstOrDefault();
            if (user == null || (user.Profile?.Role != UserRole.Coordinator && user.Profile?.Role != UserRole.Admin))
                return ApiResponse.Failure(403, "Access denied. Only coordinators and admins can view dispatch history.");

            var histories = await _orderDispatchHistoryRepository.GetAsync(
                predicate: h => h.OrderId == request.OrderId,
                orderBy: q => q.OrderByDescending(h => h.CreatedAt),
                disableTracking: true
            );

            var dtos = _mapper.Map<List<OrderDispatchHistoryDto>>(histories);
            return ApiResponse.Success(dtos, "Retrieved order dispatch history successfully.");
        }
    }
}
