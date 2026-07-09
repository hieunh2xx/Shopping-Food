using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Admin;
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
        private readonly IProductReviewRepository _productReviewRepository;
        private readonly IMapper _mapper;

        public GetReviewReportsHandler(
            IUserRepository userRepository,
            ISystemReportRepository systemReportRepository,
            IProductReviewRepository productReviewRepository,
            IMapper mapper
            )
        {
            _userRepository = userRepository;
            _systemReportRepository = systemReportRepository;
            _productReviewRepository = productReviewRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetReviewReportsQuery request, CancellationToken cancellationToken)
        {
            if(!request.CurrentUserId.HasValue)
            {
                return ApiResponse.Failure(401, "Unauthorized.");
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

            var targetIds = reports.Select(r => r.TargetId).Where(id => id.HasValue).Select(id => id.Value).ToList();
            var reviews = await _productReviewRepository.GetAsync(r => targetIds.Contains(r.Id), disableTracking: true);

            var dtos = reports.Select(r => new ReviewReportDto
            {
                Id = r.Id,
                ReporterId = r.ReporterId,
                ReporterName = r.Reporter?.FullName ?? string.Empty,
                TargetId = r.TargetId,
                Reason = r.Title,
                Description = r.Content,
                ReviewContent = reviews.FirstOrDefault(rev => rev.Id == r.TargetId)?.Comment,
                Status = r.Status.ToString(),
                CreatedAt = r.CreatedAt
            }).ToList();

            var result = new 
            {
                Items = dtos,
                TotalCount = total
            };

            return ApiResponse.Success(result, "Review reports retrieved successfully.");
        }
    }
}
