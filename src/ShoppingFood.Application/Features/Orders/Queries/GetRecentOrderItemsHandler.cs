using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Dto.Order;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetRecentOrderItemsHandler : IRequestHandler<GetRecentOrderItemsQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IMapper _mapper;

        public GetRecentOrderItemsHandler(IOrderRepository orderRepository, IMapper mapper)
        {
            _orderRepository = orderRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetRecentOrderItemsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var orders = await _orderRepository.GetAsync(
                    predicate: o => o.UserAccountId == request.CurrentUserId.Value
                                 && o.Status == OrderStatus.Delivered,
                    orderBy: q => q.OrderByDescending(o => o.CreatedAt),
                    include: q => q
                        .Include(o => o.Items)
                            .ThenInclude(i => i.Product)
                                .ThenInclude(p => p!.Images)
                        .Include(o => o.Items)
                            .ThenInclude(i => i.Product)
                                .ThenInclude(p => p!.Restaurant),
                    skip: request.Skip,
                    take: request.Take,
                    disableTracking: true
                );

                var recentItems = orders
                    .SelectMany(o => o.Items.Select(i => new { Item = i, OrderCreatedAt = o.CreatedAt }))
                    .Where(x => x.Item.ProductId.HasValue)
                    .GroupBy(x => x.Item.ProductId!.Value)
                    .Select(g =>
                    {
                        var latest = g.OrderByDescending(x => x.OrderCreatedAt).First();

                        var dto = _mapper.Map<RecentOrderItemDto>(latest.Item);

                        dto.LastOrderedAt = latest.OrderCreatedAt;

                        return dto;
                    })
                    .OrderByDescending(x => x.LastOrderedAt)
                    .Take(request.Take)
                    .ToList();

                return ApiResponse.Success(recentItems, "Recent items retrieved successfully.", recentItems.Count);
            }
            catch (Exception ex)
            {
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}
