using AutoMapper;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Admin;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetRestaurantCommissionsHandler : IRequestHandler<GetRestaurantCommissionsQuery, ApiResponse>
    {
        private readonly IRestaurantProfileRepository _repository;
        private readonly IMapper _mapper;

        public GetRestaurantCommissionsHandler(IRestaurantProfileRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetRestaurantCommissionsQuery request, CancellationToken cancellationToken)
        {
            var filterLower = request.Filter?.ToLower();

            var query = await _repository.GetAsync(
                predicate: r => 
                    (string.IsNullOrEmpty(filterLower) || r.RestaurantName.ToLower().Contains(filterLower)),
                orderBy: q => q.OrderBy(r => r.RestaurantName),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
            );
            
            var countQuery = await _repository.GetAsync(
                predicate: r => 
                    (string.IsNullOrEmpty(filterLower) || r.RestaurantName.ToLower().Contains(filterLower)),
                disableTracking: true
            );
            var totalCount = countQuery.Count();

            return ApiResponse.Success(new
            {
                Items = _mapper.Map<List<RestaurantCommissionDto>>(query.ToList()),
                TotalCount = totalCount,
                Page = (request.Skip / request.Take) + 1,
                PageSize = request.Take
            }, "Thành công", totalCount);
        }
    }
}
