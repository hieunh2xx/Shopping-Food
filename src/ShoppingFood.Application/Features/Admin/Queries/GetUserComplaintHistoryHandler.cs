using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Coordinator;
using ShoppingFood.Repository.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetUserComplaintHistoryHandler : IRequestHandler<GetUserComplaintHistoryQuery, ApiResponse>
    {
        private readonly ISystemReportRepository _systemReportRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public GetUserComplaintHistoryHandler(
            ISystemReportRepository systemReportRepository,
            IUserRepository userRepository,
            IMapper mapper)
        {
            _systemReportRepository = systemReportRepository;
            _userRepository = userRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetUserComplaintHistoryQuery request, CancellationToken cancellationToken)
        {
            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.UserId,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );
            var userProfileId = users.FirstOrDefault()?.Profile?.Id;

            if (!userProfileId.HasValue)
            {
                return ApiResponse.Failure(404, "User profile not found.");
            }

            var reports = await _systemReportRepository.GetAsync(
                predicate: r => r.ReporterId == userProfileId.Value,
                orderBy: q => q.OrderByDescending(r => r.CreatedAt),
                include: q => q.Include(r => r.Reporter),
                disableTracking: true
                );

            var result = new List<IncidentItemDto>();
            foreach (var r in reports)
            {
                var dto = _mapper.Map<IncidentItemDto>(r);

                dto.IncidentType = r.TargetType == Domain.Enums.ReportTargetType.Order
                    ? "OrderComplaint"
                    : r.TargetType == Domain.Enums.ReportTargetType.Shipper 
                        ? "ShipperComplaint" 
                        : "RestaurantComplaint";
                dto.ContactName = r.Reporter?.FullName ?? string.Empty;
                dto.ShipperProfileId = r.TargetType == Domain.Enums.ReportTargetType.Shipper ? r.TargetId : null;
                result.Add(dto);
            }

            return ApiResponse.Success(result, "Lấy lịch sử khiếu nại thành công.");
        }
    }
}
