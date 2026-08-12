using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Common;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Coordinator;
using ShoppingFood.Dto.Order;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Queries
{
    public class GetDispatchBoardHandler : IRequestHandler<GetDispatchBoardQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IUserRepository _userRepository;
        private readonly IOrderDeliveryProposalRepository _orderDeliveryProposalRepository;
        private readonly IMapper _mapper;

        public GetDispatchBoardHandler(
            IOrderRepository orderRepository,
            IUserRepository userRepository,
            IOrderDeliveryProposalRepository orderDeliveryProposalRepository,
            IMapper mapper)
        {
            _orderRepository = orderRepository;
            _userRepository = userRepository;
            _orderDeliveryProposalRepository = orderDeliveryProposalRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetDispatchBoardQuery request, CancellationToken cancellationToken)
        {
            try
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

                var todayUtc = DateTime.UtcNow.Date;
                Expression<Func<Order, bool>> predicate = o => o.CreatedAt >= todayUtc;

                if (request.IsEscalated == true)
                {
                    var escalatedProposalOrderIds = await GetEscalatedProposalOrderIdsAsync();
                    var timeLimit = DateTime.UtcNow.AddMinutes(-15);

                    predicate = o => o.CreatedAt >= todayUtc && ((o.Status == OrderStatus.WaitingForShipper && o.UpdatedAt <= timeLimit) ||
                                    escalatedProposalOrderIds.Contains(o.Id));
                }
                else if (!string.IsNullOrWhiteSpace(request.Status))
                {
                    if (Enum.TryParse<OrderStatus>(request.Status, true, out var parsedStatus))
                    {
                        predicate = o => o.CreatedAt >= todayUtc && o.Status == parsedStatus;
                    }
                    else
                    {
                        return ApiResponse.Failure(400, "Invalid status filter value.");
                    }
                }

                Func<IQueryable<Order>, IOrderedQueryable<Order>> orderBy = q => q.OrderByDescending(o => o.CreatedAt);

                if (!string.IsNullOrWhiteSpace(request.Status) &&
                    request.Status.Equals(OrderStatus.WaitingForShipper.ToString(), StringComparison.OrdinalIgnoreCase))
                {
                    orderBy = q => q.OrderBy(o => o.CreatedAt);
                }

                var orders = await _orderRepository.GetAsync(
                    predicate: predicate,
                    orderBy: orderBy,
                    include: q => q.Include(o => o.Items)
                                    .ThenInclude(i => i.Product)
                                    .ThenInclude(p => p.Restaurant)
                                   .Include(o => o.Shipper)
                                    .ThenInclude(s => s.UserProfile)
                                        .ThenInclude(u => u.UserAccount)
                                   .Include(o => o.UserAccount)
                                    .ThenInclude(u => u.Profile),
                    skip: request.Skip,
                    take: request.Take,
                    disableTracking: true
                    );

                var dto = _mapper.Map<List<DispatchOrderDto>>(orders);

                var shippingToday = await _orderRepository.GetAsync(
                    predicate: o =>
                        o.CreatedAt >= todayUtc &&
                        o.Status == OrderStatus.Shipping &&
                        o.ShipperId.HasValue,
                    include: q => q.Include(o => o.Items).ThenInclude(i => i.Product),
                    disableTracking: true
                );

                var batchLookup = shippingToday
                    .Select(o => new
                    {
                        Order = o,
                        RestaurantId = o.Items?.FirstOrDefault()?.Product?.RestaurantId
                    })
                    .Where(x => x.RestaurantId.HasValue)
                    .GroupBy(x => new { ShipperId = x.Order.ShipperId!.Value, RestaurantId = x.RestaurantId!.Value })
                    .Where(g => g.Count() >= 2)
                    .ToDictionary(
                        g => (g.Key.ShipperId, g.Key.RestaurantId),
                        g =>
                        {
                            var ordered = g.Select(x => x.Order).OrderBy(o => o.Id).ToList();
                            var ids = ordered.Select(o => o.Id).ToList();
                            return new
                            {
                                Code = BatchPickupCodeHelper.Compute(g.Key.ShipperId, g.Key.RestaurantId, ids),
                                Labels = ordered.Select(o => new BatchOrderLabelDto
                                {
                                    OrderId = o.Id,
                                    ShortCode = o.Id.ToString("N")[..8].ToUpperInvariant(),
                                    ContactName = string.IsNullOrWhiteSpace(o.ContactName) ? "Khách" : o.ContactName
                                }).ToList()
                            };
                        });

                foreach (var item in dto)
                {
                    if (!item.ShipperId.HasValue || !item.RestaurantId.HasValue) continue;
                    if (!batchLookup.TryGetValue((item.ShipperId.Value, item.RestaurantId.Value), out var batch)) continue;
                    item.BatchPickupCode = batch.Code;
                    item.BatchBagCount = batch.Labels.Count;
                    item.BatchOrderLabels = batch.Labels;
                }

                return ApiResponse.Success(dto, "Dispatch board orders retrieved successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse.Failure(500, $"An error occurred: {ex.Message}");
            }
        }

        private async Task<List<Guid>> GetEscalatedProposalOrderIdsAsync()
        {
            var proposals = await _orderDeliveryProposalRepository.GetAsync(
                predicate: p => p.Status == ProposalStatus.Rejected || p.Status == ProposalStatus.Expired,
                disableTracking: true
                );

            return proposals
                .GroupBy(p => p.OrderId)
                .Where(g => g.Count() >= 3)
                .Select(g => g.Key)
                .ToList();
        }
    }
}
