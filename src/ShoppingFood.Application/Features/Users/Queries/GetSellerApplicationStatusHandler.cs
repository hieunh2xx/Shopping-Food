using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.User;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Users.Queries
{
    public class GetSellerApplicationStatusHandler : IRequestHandler<GetSellerApplicationStatusQuery, ApiResponse>
    {
        private readonly ISellerApplicationRepository _sellerApplicationRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public GetSellerApplicationStatusHandler(
            ISellerApplicationRepository sellerApplicationRepository, IUserRepository userRepository, IMapper mapper) {
            _sellerApplicationRepository = sellerApplicationRepository;
            _userRepository = userRepository;
            _mapper = mapper;
        }
        public async Task<ApiResponse> Handle(GetSellerApplicationStatusQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile)
                );

            var user = users.FirstOrDefault();
            if (user?.Profile == null)
                return ApiResponse.Failure(404, "User profile not found");

            var applications = await _sellerApplicationRepository.GetAsync(
                predicate: a => a.UserProfileId == user.Profile.Id,
                orderBy: q => q.OrderByDescending(a => a.CreatedAt),
                disableTracking: true
                );
            var lastestApplication = applications.FirstOrDefault();

            if (lastestApplication == null)
                return ApiResponse.Success(null, "No seller application found for this user.");

            var dto = _mapper.Map<SellerApplicationStatusDto>(lastestApplication);
            return ApiResponse.Success(dto, "Seller application status retrieved successfully");
        }
    }
}
