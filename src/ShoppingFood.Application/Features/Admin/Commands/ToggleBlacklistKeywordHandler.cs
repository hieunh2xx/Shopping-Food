using AutoMapper;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Dto.Admin;
using ShoppingFood.Repository.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class ToggleBlacklistKeywordHandler : IRequestHandler<ToggleBlacklistKeywordCommand, ApiResponse>
    {
        private readonly IBlacklistKeywordRepository _repo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ToggleBlacklistKeywordHandler(IBlacklistKeywordRepository repo, IUnitOfWork unitOfWork, IMapper mapper)
        {
            _repo = repo;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(ToggleBlacklistKeywordCommand request, CancellationToken cancellationToken)
        {
            var keyword = await _repo.GetByIdAsync(request.Id);
            if (keyword == null)
            {
                return ApiResponse.Failure(404, "Keyword not found.");
            }

            keyword.IsActive = !keyword.IsActive;
            _repo.Update(keyword);
            await _unitOfWork.SaveChangesAsync();

            var dto = _mapper.Map<BlacklistKeywordDto>(keyword);
            return ApiResponse.Success(dto, "Keyword status updated successfully.");
        }
    }
}
