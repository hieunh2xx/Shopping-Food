using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Support;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Support.Commands
{
    public class SubmitAppealHandler : IRequestHandler<SubmitAppealCommand, ApiResponse>
    {
        private readonly ISystemReportRepository _systemReportRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public SubmitAppealHandler(
            ISystemReportRepository systemReportRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _systemReportRepository = systemReportRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(SubmitAppealCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized access.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile)
            );
            var user = users.FirstOrDefault();

            if (user == null || user.Profile == null)
                return ApiResponse.Failure(404, "User profile not found.");

            // Defense in Depth: Only Seller or Mall can submit appeal for their account
            if (user.Profile.Role != UserRole.Seller && user.Profile.Role != UserRole.Mall)
                return ApiResponse.Failure(403, "Forbidden. Only Sellers and Malls can submit appeals.");

            var report = new SystemReport
            {
                Id = Guid.NewGuid(),
                ReporterId = user.Profile.Id,
                TargetId = null, // Representing their own account
                TargetType = ReportTargetType.SystemAppeal,
                Title = "Kháng nghị tài khoản bị khóa/hạn chế",
                Content = request.Content,
                Status = ReportStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _systemReportRepository.Add(report);
            var result = await _unitOfWork.SaveChangesAsync();

            if (result > 0)
            {
                var dto = _mapper.Map<SystemReportDto>(report);
                return ApiResponse.Success(dto, "Your appeal has been submitted successfully and is pending review.");
            }

            return ApiResponse.Failure(400, "Failed to submit appeal.");
        }
    }
}
