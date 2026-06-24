using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.LoyaltyPoint;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.LoyaltyPoints.Queries
{
    public class GetPointGiftConfigsHandler : IRequestHandler<GetPointGiftConfigsQuery, ApiResponse>
    {
        private readonly IPointGiftConfigRepository _pointGiftConfigRepository;
        private readonly IMapper _mapper;

        public GetPointGiftConfigsHandler(
            IPointGiftConfigRepository pointGiftConfigRepository,
            IMapper mapper)
        {
            _pointGiftConfigRepository = pointGiftConfigRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetPointGiftConfigsQuery request, CancellationToken cancellationToken)
        {
            var configs = await _pointGiftConfigRepository.GetAsync(
                predicate: p => !p.IsDeleted &&
                                (!request.IsActiveOnly.HasValue || p.IsActive == request.IsActiveOnly.Value),
                include: q => q.Include(p => p.Discount),
                orderBy: q => q.OrderByDescending(p => p.CreatedAt),
                disableTracking: true
                );

            var listDto = _mapper.Map<List<PointGiftConfigDto>>(configs);
            return ApiResponse.Success(listDto, "Retrieve point gift configs successfully.");
        }
    }
}
