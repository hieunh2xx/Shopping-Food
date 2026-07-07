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
    public class GetAllDispatchHistoryHandler : IRequestHandler<GetAllDispatchHistoryQuery, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IOrderDispatchHistoryRepository _orderDispatchHistoryRepository;
        private readonly IMapper _mapper;

        public GetAllDispatchHistoryHandler(
            IUserRepository userRepository,
            IOrderDispatchHistoryRepository orderDispatchHistoryRepository,
            IMapper mapper)
        {
            _userRepository = userRepository;
            _orderDispatchHistoryRepository = orderDispatchHistoryRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetAllDispatchHistoryQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );
            var user = users.FirstOrDefault();
            if (user == null)
                return ApiResponse.Failure(401, "User not found.");

            var filterLower = request.Filter?.ToLower();
            
            DispatchActionType? filterAction = null;
            if (!string.IsNullOrEmpty(request.ActionType) && System.Enum.TryParse<DispatchActionType>(request.ActionType, true, out var parsedAction))
            {
                filterAction = parsedAction;
            }

            var histories = await _orderDispatchHistoryRepository.GetAsync(
                predicate: h =>
                    (!request.OrderId.HasValue || h.OrderId == request.OrderId.Value) &&
                    (!filterAction.HasValue || h.ActionType == filterAction.Value) &&
                    (string.IsNullOrEmpty(filterLower) || 
                     h.ActorName.ToLower().Contains(filterLower) || 
                     (h.TargetShipperName != null && h.TargetShipperName.ToLower().Contains(filterLower)) ||
                     h.OrderId.ToString().ToLower().Contains(filterLower)),
                orderBy: q => q.OrderByDescending(h => h.CreatedAt),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
            );

            var total = await _orderDispatchHistoryRepository.GetCountAsync(
                predicate: h =>
                    (!request.OrderId.HasValue || h.OrderId == request.OrderId.Value) &&
                    (!filterAction.HasValue || h.ActionType == filterAction.Value) &&
                    (string.IsNullOrEmpty(filterLower) || 
                     h.ActorName.ToLower().Contains(filterLower) || 
                     (h.TargetShipperName != null && h.TargetShipperName.ToLower().Contains(filterLower)) ||
                     h.OrderId.ToString().ToLower().Contains(filterLower))
            );

            var dtos = _mapper.Map<List<OrderDispatchHistoryDto>>(histories);
            return ApiResponse.Success(dtos, "Lấy danh sách lịch sử điều phối thành công.", total);
        }
    }
}
