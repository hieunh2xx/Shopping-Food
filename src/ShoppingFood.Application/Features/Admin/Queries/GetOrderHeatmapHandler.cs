using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Admin;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetOrderHeatmapHandler : IRequestHandler<GetOrderHeatmapQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;

        public GetOrderHeatmapHandler(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        public async Task<ApiResponse> Handle(GetOrderHeatmapQuery request, CancellationToken cancellationToken)
        {
            var endDate = DateTime.UtcNow;
            var startDate = endDate.AddDays(-request.Days);

            var orders = await _orderRepository.GetAsync(
                predicate: o => o.DeliveryLatitude != null && o.DeliveryLongitude != null && o.CreatedAt.Date >= startDate.Date && o.CreatedAt.Date <= endDate.Date,
                disableTracking: true
            );

            var heatmapData = orders.Select(o => new HeatmapPointDto
            {
                Latitude = o.DeliveryLatitude.Value,
                Longitude = o.DeliveryLongitude.Value,
                Weight = 1.0 // Each order is weight 1, could be based on TotalAmount
            }).ToList();

            return ApiResponse.Success(heatmapData);
        }
    }
}
