using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Support;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetReviewReportsHandler : IRequestHandler<GetReviewReportsQuery, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly ISystemReportRepository _systemReportRepository;
        private readonly IMapper _mapper;

        public GetReviewReportsHandler(
            IUserRepository userRepository,
            ISystemReportRepository systemReportRepository,
            IMapper mapper
            )
        {
            _userRepository = userRepository;
            _systemReportRepository = systemReportRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetReviewReportsQuery request, CancellationToken cancellationToken)
        {
            if(!request.CurrentUserId.HasValue)
            {
                return ApiResponse.Failure(401, "Unauthorized.");
            }

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );
            var userProfile = users.FirstOrDefault()?.Profile;
            if(userProfile == null || userProfile.Role != Domain.Enums.UserRole.Admin)
            {
                return ApiResponse.Failure(403, "Forbidden.");
            }

            var reports = await _systemReportRepository.GetAsync(
                predicate: r => r.TargetType == Domain.Enums.ReportTargetType.Review &&
                                r.Status == Domain.Enums.ReportStatus.Pending,
                orderBy: q => q.OrderByDescending(r => r.CreatedAt),
                include: q => q.Include(r => r.Reporter),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
                );

            var total = await _systemReportRepository.GetCountAsync(
                predicate: r => r.TargetType == Domain.Enums.ReportTargetType.Review &&
                                r.Status == Domain.Enums.ReportStatus.Pending
                );

            var dto = _mapper.Map<List<SystemReportDto>>(reports);
            return ApiResponse.Success( dto, "Review reports retrieved successfully." );
        }
    }
}
