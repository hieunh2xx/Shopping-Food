using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.User;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetSellerApplicationsHandler : IRequestHandler<GetSellerApplicationsQuery, ApiResponse>
    {
        private readonly ISellerApplicationRepository _sellerApplicationRepository;
        private readonly IMapper _mapper;

        public GetSellerApplicationsHandler(
            ISellerApplicationRepository sellerApplicationRepository,
            IMapper mapper)
        {
            _sellerApplicationRepository = sellerApplicationRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetSellerApplicationsQuery request, CancellationToken cancellationToken)
        {
            var applications = await _sellerApplicationRepository.GetAsync(
                predicate: a => !request.Status.HasValue || a.Status == request.Status.Value,
                include: q => q.Include(a => a.UserProfile)
                               .ThenInclude(up => up.UserAccount),
                orderBy: q => q.OrderByDescending(a => a.CreatedAt),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
            );

            var total = await _sellerApplicationRepository.GetCountAsync(
                predicate: a => !request.Status.HasValue || a.Status == request.Status.Value
            );

            var dtos = _mapper.Map<IReadOnlyList<SellerApplicationDto>>(applications);

            return ApiResponse.Success(dtos, "Seller applications retrieved successfully", total);
        }
    }
}
