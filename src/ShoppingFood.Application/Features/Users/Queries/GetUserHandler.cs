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
        private readonly IMapper _mapper;

        public GetUserHandler(IUserRepository userRepository, IMapper mapper)
        {
            _userRepository = userRepository;
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

            return ApiResponse.Success(userDtos, "Users retrieved successfully", total);
        }
    }
}
