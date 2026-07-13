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
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Queries
{
    public class GetOrderComplaintsHandler : IRequestHandler<GetOrderComplaintsQuery, ApiResponse>
    {
        private readonly ISystemReportRepository _reportRepo;
        private readonly IOrderRepository _orderRepo;

        public GetOrderComplaintsHandler(ISystemReportRepository reportRepo, IOrderRepository orderRepo)
        {
            _reportRepo = reportRepo;
            _orderRepo = orderRepo;
        }

        public async Task<ApiResponse> Handle(GetOrderComplaintsQuery request, CancellationToken cancellationToken)
        {
            IEnumerable<SystemReport> reportsQuery = await _reportRepo.GetAsync(
                predicate: r => r.TargetType == ReportTargetType.Order,
                include: q => q.Include(r => r.Reporter),
                disableTracking: true
            );

            if (!string.IsNullOrEmpty(request.Status) && request.Status != "All")
            {
                if (Enum.TryParse<ReportStatus>(request.Status, true, out var statusEnum))
                {
                    reportsQuery = reportsQuery.Where(r => r.Status == statusEnum);
                }
            }

            var reports = reportsQuery.OrderByDescending(r => r.CreatedAt).Skip(request.Skip).Take(request.Take).ToList();
            var result = new List<OrderComplaintDto>();

            foreach (var r in reports)
            {
                var orderId = r.TargetId ?? Guid.Empty;
                var orderList = await _orderRepo.GetAsync(
                    predicate: o => o.Id == orderId,
                    include: q => q.Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Restaurant),
                    disableTracking: true
                );
                var order = orderList.FirstOrDefault();

                var dto = new OrderComplaintDto
                {
                    ReportId = r.Id,
                    ReporterName = r.Reporter?.FullName ?? "Unknown",
                    RestaurantName = order?.Items.FirstOrDefault()?.Product?.Restaurant?.RestaurantName ?? "Unknown",
                    OrderId = orderId.ToString(),
                    OrderTotalAmount = order?.TotalAmount ?? 0,
                    Title = r.Title,
                    Content = r.Content ?? string.Empty,
                    CreatedAt = r.CreatedAt,
                    Status = r.Status.ToString()
                };
                result.Add(dto);
            }

            return ApiResponse.Success(result);
        }
    }
}
