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
    public class GetShipperApplicationsHandler : IRequestHandler<GetShipperApplicationsQuery, ApiResponse>
    {
        private readonly IShipperApplicationRepository _shipperApplicationRepository;
        private readonly IMapper _mapper;

        public GetShipperApplicationsHandler(
            IShipperApplicationRepository shipperApplicationRepository,
            IMapper mapper)
        {
            _shipperApplicationRepository = shipperApplicationRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetShipperApplicationsQuery request, CancellationToken cancellationToken)
        {
            var applications = await _shipperApplicationRepository.GetAsync(
                predicate: a => !request.Status.HasValue || a.Status == request.Status.Value,
                include: q => q.Include(a => a.UserProfile)
                               .ThenInclude(up => up.UserAccount),
                orderBy: q => q.OrderByDescending(a => a.CreatedAt),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
            );

            var total = await _shipperApplicationRepository.GetCountAsync(
                predicate: a => !request.Status.HasValue || a.Status == request.Status.Value
            );

            var dtos = _mapper.Map<IReadOnlyList<ShipperApplicationDto>>(applications);

            return ApiResponse.Success(dtos, "Shipper applications retrieved successfully", total);
        }
    }
}
