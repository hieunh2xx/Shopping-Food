using AutoMapper;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.GlobalMenuCategories.Commands
{
    public class ToggleGlobalMenuCategoryVisibilityHandler : IRequestHandler<ToggleGlobalMenuCategoryVisibilityCommand, ApiResponse>
    {
        private readonly IGlobalMenuCategoryRepository _globalMenuCategoryRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ToggleGlobalMenuCategoryVisibilityHandler(
            IGlobalMenuCategoryRepository globalMenuCategoryRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _globalMenuCategoryRepository = globalMenuCategoryRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(ToggleGlobalMenuCategoryVisibilityCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var globalMenuCategory = await _globalMenuCategoryRepository.GetByIdAsync(request.Id);
                if (globalMenuCategory == null)
                    return ApiResponse.Failure(404, "Global Menu Category not found.");

                globalMenuCategory.IsHidden = !globalMenuCategory.IsHidden;
                globalMenuCategory.UpdatedAt = DateTime.UtcNow;

                _globalMenuCategoryRepository.Update(globalMenuCategory);
                await _unitOfWork.SaveChangesAsync();

                var dto = _mapper.Map<GlobalMenuCategoryDto>(globalMenuCategory);
                string message = globalMenuCategory.IsHidden ? "Global Menu Category has been hidden." : "Global Menu Category is now visible.";

                return ApiResponse.Success(dto, message);
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("ToggleGlobalMenuCategoryVisibilityHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}
