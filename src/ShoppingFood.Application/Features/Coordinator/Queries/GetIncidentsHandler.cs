using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Dto.Coordinator;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Queries
{
    public class GetIncidentsHandler : IRequestHandler<GetIncidentsQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly ISystemReportRepository _systemReportRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public GetIncidentsHandler(
            IOrderRepository orderRepository,
            ISystemReportRepository systemReportRepository,
            IUserRepository userRepository,
            IMapper mapper)
        {
            _orderRepository = orderRepository;
            _systemReportRepository = systemReportRepository;
            _userRepository = userRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetIncidentsQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null || (userProfile.Role != Domain.Enums.UserRole.Admin && userProfile.Role != Domain.Enums.UserRole.Coordinator))
                return ApiResponse.Failure(403, "Forbidden.");

            var result = new List<IncidentItemDto>();

            if(request.IncidentType == null || request.IncidentType == "DeliveryFailed")
            {
                var failedOrders = await _orderRepository.GetAsync(
                    predicate: o => o.Status == Domain.Enums.OrderStatus.Cancelled
                                && o.RejectReason != null
                                && o.RejectReason.StartsWith("[Delivery Failed]")
                                && !o.RejectReason.Contains("Resolved:"),
                    orderBy: q => q.OrderByDescending(o => o.UpdatedAt),
                    disableTracking: true
                    );

                result.AddRange(failedOrders.Select(o => new IncidentItemDto
                {
                    Id = o.Id,
                    IncidentType = "DeliveryFailed",
                    Title = "Giao hàng thất bại",
                    Description = o.RejectReason,
                    Status = "Pending",
                    OrderId = o.Id,
                    ShipperProfileId = o.ShipperId,
                    ContactName = o.ContactName,
                    ContactPhone = o.ContactPhone,
                    CreatedAt = o.UpdatedAt
                }));
            }

            var targetTypes = new List<ReportTargetType>();
            if (request.IncidentType == null || request.IncidentType == "OrderComplaint")
                targetTypes.Add(ReportTargetType.Order);
            if (request.IncidentType == null || request.IncidentType == "ShipperComplaint")
                targetTypes.Add(ReportTargetType.Shipper);
            if (request.IncidentType == null || request.IncidentType == "RestaurantComplaint")
                targetTypes.Add(ReportTargetType.Restaurant);

            if (targetTypes.Any())
            {
                var reports = await _systemReportRepository.GetAsync(
                    predicate: r => targetTypes.Contains(r.TargetType) && r.Status == ReportStatus.Pending,
                    orderBy: q => q.OrderByDescending(r => r.CreatedAt),
                    include: q => q.Include(r => r.Reporter),
                    disableTracking: true
                    );
                foreach(var r in reports)
                {
                    var dto = _mapper.Map<IncidentItemDto>(r);

                    dto.IncidentType = r.TargetType == ReportTargetType.Order
                        ? "OrderComplaint"
                        : r.TargetType == ReportTargetType.Shipper 
                            ? "ShipperComplaint" 
                            : "RestaurantComplaint";
                    dto.ContactName = r.Reporter?.FullName ?? string.Empty;
                    dto.ShipperProfileId = r.TargetType == ReportTargetType.Shipper ? r.TargetId : null;
                    result.Add(dto);
                }
            }

            var sorted = result
                .OrderByDescending(x => x.CreatedAt)
                .Skip(request.Skip)
                .Take(request.Take)
                .ToList();
            return ApiResponse.Success(sorted, "Incidents retrieved successfully.");
        }
    }
}
