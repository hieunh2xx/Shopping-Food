using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Coordinator;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Queries
{
    public class GetMonitorShipperHandler : IRequestHandler<GetMonitorShipperQuery, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IMapper _mapper;

        public GetMonitorShipperHandler(
            IUserRepository userRepisitory, 
            IShipperProfileRepository shipperProfileRepository,
            IOrderRepository orderRepository,
            IMapper mapper)
        {
            _userRepository = userRepisitory;
            _shipperProfileRepository = shipperProfileRepository;
            _orderRepository = orderRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetMonitorShipperQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var authCheck = await CheckAuthorizationAsync(request.CurrentUserId);
                if (authCheck != null) return authCheck;

                var shippers = await GetFilteredShippersAsync(request.IsOnline, request.SearchName);

                var busyShipperIds = await GetBusyShipperIdsAsync();
                var completedOrdersCountMap = await GetCompletedOrdersCountMapAsync();

                var result = shippers.Select(shipper =>
                {
                    var dto = _mapper.Map<MonitorShipperDto>(shipper);
                    dto.IsBusy = busyShipperIds.Contains(shipper.Id);
                    dto.CompletedOrderCount = completedOrdersCountMap.TryGetValue(shipper.Id, out var completedCount) ? completedCount : 0;
                    return dto;
                }).ToList();

                return ApiResponse.Success(result, "Monitor shipper list retrieved successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task<ApiResponse?> CheckAuthorizationAsync(Guid? currentUserId)
        {
            if (!currentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == currentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );
            var user = users.FirstOrDefault();
            if (user == null || (user.Profile.Role != UserRole.Coordinator && user.Profile.Role != UserRole.Admin))
                return ApiResponse.Failure(403, "Access denied. Only coordinators and admins can monitor shippers.");

            return null;
        }

        private async Task<List<ShipperProfile>> GetFilteredShippersAsync(bool? isOnline, string? searchName)
        {
            var shippers = await _shipperProfileRepository.GetAsync(
                predicate: s => (!isOnline.HasValue || s.IsOnline == isOnline.Value) &&
                                (string.IsNullOrEmpty(searchName) ||
                                s.UserProfile.FullName.Contains(searchName) ||
                                s.UserProfile.UserAccount.Phone.Contains(searchName)),
                include: q => q.Include(s => s.UserProfile) 
                                    .ThenInclude(u => u.UserAccount),
                disableTracking: true
                );
            return shippers.ToList();
        }

        private async Task<HashSet<Guid>> GetBusyShipperIdsAsync()
        {
            var activeOrders = await _orderRepository.GetAsync(
                predicate: o => o.ShipperId.HasValue && (o.Status == OrderStatus.Shipping && o.Status == OrderStatus.WaitingForShipper),
                disableTracking: true
                );

            return activeOrders.Select(o => o.ShipperId!.Value).ToHashSet();
        }

        private async Task<Dictionary<Guid, int>> GetCompletedOrdersCountMapAsync()
        {
            var completedOrders = await _orderRepository.GetAsync(
                predicate: o => o.ShipperId.HasValue && o.Status == OrderStatus.Delivered,
                disableTracking: true
                );

            return completedOrders.GroupBy(o => o.ShipperId!.Value).ToDictionary(g => g.Key, g => g.Count());
        }
    }
}
