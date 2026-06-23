using AutoMapper;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.LoyaltyPoint;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.LoyaltyPoints.Queries
{
    public class GetCustomerLoyaltyPointsHandler : IRequestHandler<GetCustomerLoyaltyPointsQuery, ApiResponse>
    {
        private readonly ILoyaltyPointRepository _loyaltyPointRepository;
        private readonly ILoyaltyPointHistoryRepository _loyaltyPointHistoryRepository;
        private readonly IMapper _mapper;

        public GetCustomerLoyaltyPointsHandler(
            ILoyaltyPointRepository loyaltyPointRepository,
            ILoyaltyPointHistoryRepository loyaltyPointHistoryRepository, 
            IMapper mapper)
        {
            _loyaltyPointRepository = loyaltyPointRepository;
            _loyaltyPointHistoryRepository = loyaltyPointHistoryRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetCustomerLoyaltyPointsQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var loyaltyPoint = (await _loyaltyPointRepository.GetAsync(
                predicate: lp => lp.UserAccountId == request.CurrentUserId.Value,
                disableTracking: true
                )).FirstOrDefault();
            if (loyaltyPoint == null)
            {
                var defaultPoints = new LoyaltyPointDto
                {
                    UserAccountId = request.CurrentUserId.Value,
                    PointsBalance = 0,
                    TotalEarnedPoints = 0,
                    Tier = MemberTier.Bronze.ToString(),
                    UpdatedAt = DateTime.UtcNow,
                    History = new List<LoyaltyPointHistoryDto>()
                };
                return ApiResponse.Success(defaultPoints, "Get loyalty points successfully.");
            }

            var dto = _mapper.Map<LoyaltyPointDto>(loyaltyPoint);

            var histories = await _loyaltyPointHistoryRepository.GetAsync(
                predicate: l => l.UserAccountId == request.CurrentUserId.Value,
                orderBy: q => q.OrderByDescending(l => l.CreatedAt),
                disableTracking: true
                );

            dto.History = _mapper.Map<List<LoyaltyPointHistoryDto>>(histories);

            return ApiResponse.Success(dto, "Get loyalty points history successfully.");
        }
    }
}
