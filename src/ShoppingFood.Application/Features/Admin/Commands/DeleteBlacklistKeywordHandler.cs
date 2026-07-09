using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class DeleteBlacklistKeywordHandler : IRequestHandler<DeleteBlacklistKeywordCommand, ApiResponse>
    {
        private readonly IBlacklistKeywordRepository _repo;
        private readonly IUnitOfWork _unitOfWork;

        public DeleteBlacklistKeywordHandler(IBlacklistKeywordRepository repo, IUnitOfWork unitOfWork)
        {
            _repo = repo;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(DeleteBlacklistKeywordCommand request, CancellationToken cancellationToken)
        {
            var keyword = await _repo.GetByIdAsync(request.Id);
            if (keyword == null)
            {
                return ApiResponse.Failure(404, "Keyword not found.");
            }

            _repo.Delete(keyword);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(null, "Keyword deleted successfully.");
        }
    }
}
