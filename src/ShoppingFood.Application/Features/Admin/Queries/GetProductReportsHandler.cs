using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Support;
using ShoppingFood.Repository.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetProductReportsHandler : IRequestHandler<GetProductReportsQuery, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly ISystemReportRepository _systemReportRepository;
        private readonly IMapper _mapper;

        public GetProductReportsHandler(
            IUserRepository userRepository,
            ISystemReportRepository systemReportRepository,
            IMapper mapper
            )
        {
            _userRepository = userRepository;
            _systemReportRepository = systemReportRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetProductReportsQuery request, CancellationToken cancellationToken)
        {
            if(!request.CurrentUserId.HasValue)
            {
                return ApiResponse.Failure(401, "Unauthorized.");
            }

            var reports = await _systemReportRepository.GetAsync(
                predicate: r => r.TargetType == Domain.Enums.ReportTargetType.Product &&
                                r.Status == Domain.Enums.ReportStatus.Pending,
                orderBy: q => q.OrderByDescending(r => r.CreatedAt),
                include: q => q.Include(r => r.Reporter),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
                );

            var total = await _systemReportRepository.GetCountAsync(
                predicate: r => r.TargetType == Domain.Enums.ReportTargetType.Product &&
                                r.Status == Domain.Enums.ReportStatus.Pending
                );

            var dto = _mapper.Map<List<SystemReportDto>>(reports);
            return ApiResponse.Success( dto, "Product reports retrieved successfully." );
        }
    }
}
