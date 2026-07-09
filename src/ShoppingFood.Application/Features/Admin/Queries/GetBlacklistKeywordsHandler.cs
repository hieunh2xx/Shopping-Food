using AutoMapper;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Admin;
using ShoppingFood.Repository.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetBlacklistKeywordsHandler : IRequestHandler<GetBlacklistKeywordsQuery, ApiResponse>
    {
        private readonly IBlacklistKeywordRepository _repo;
        private readonly IMapper _mapper;

        public GetBlacklistKeywordsHandler(IBlacklistKeywordRepository repo, IMapper mapper)
        {
            _repo = repo;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetBlacklistKeywordsQuery request, CancellationToken cancellationToken)
        {
            var keywords = await _repo.GetAsync();
            var dtos = _mapper.Map<List<BlacklistKeywordDto>>(keywords.OrderByDescending(x => x.CreatedAt));
            return ApiResponse.Success(dtos, "Success");
        }
    }
}
