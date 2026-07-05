using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.User;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Users.Queries
{
    public class GetUserHandler : IRequestHandler<GetUserQuery, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly ILoyaltyPointRepository _loyaltyPointRepository;
        private readonly IMapper _mapper;

        public GetUserHandler(IUserRepository userRepository, ILoyaltyPointRepository loyaltyPointRepository, IMapper mapper)
        {
            _userRepository = userRepository;
            _loyaltyPointRepository = loyaltyPointRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetUserQuery request, CancellationToken cancellationToken)
        {
            Expression<Func<User, bool>>? predicate = null;

            if (!string.IsNullOrEmpty(request.Filter))
            {
                predicate = u => u.UserName!.Contains(request.Filter) || u.Email!.Contains(request.Filter);
            }

            var users = await _userRepository.GetAsync(
                predicate: predicate,
                include: q => q.Include(u => u.Profile!),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
            );

            var total = await _userRepository.GetCountAsync(predicate);

            var userDtos = _mapper.Map<IReadOnlyList<UserDto>>(users);

            var userIds = users.Select(u => u.Id).ToList();
            var loyaltyPoints = await _loyaltyPointRepository.GetAsync(
                predicate: lp => userIds.Contains(lp.UserAccountId),
                disableTracking: true
            );
            var lpDict = loyaltyPoints.ToDictionary(lp => lp.UserAccountId);

            foreach (var dto in userDtos)
            {
                if (lpDict.TryGetValue(dto.Id, out var lp))
                {
                    dto.Tier = lp.Tier.ToString();
                    dto.TotalEarnedPoints = lp.TotalEarnedPoints;
                    dto.PointsBalance = lp.PointsBalance;
                }
            }

            return ApiResponse.Success(userDtos, "Users retrieved successfully", total);
        }
    }
}
