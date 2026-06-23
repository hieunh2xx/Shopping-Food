using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.GlobalMenuCategories.Commands
{
    public class DeleteGlobalMenuCategoryCommandHandler : IRequestHandler<DeleteGlobalMenuCategoryCommand, ApiResponse>
    {
        private readonly IGlobalMenuCategoryRepository _globalMenuCategoryRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DeleteGlobalMenuCategoryCommandHandler(IGlobalMenuCategoryRepository globalMenuCategoryRepository, IUnitOfWork unitOfWork)
        {
            _globalMenuCategoryRepository = globalMenuCategoryRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(DeleteGlobalMenuCategoryCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var globalMenuCategory = await _globalMenuCategoryRepository.GetByIdAsync(request.Id);

                if (globalMenuCategory == null)
                    return ApiResponse.Failure(404, "This category cannot be found");

                _globalMenuCategoryRepository.Delete(globalMenuCategory);

                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(null, "Delete global menu category succesfully");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("DeleteGlobalMenuCategoryCommandHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}
