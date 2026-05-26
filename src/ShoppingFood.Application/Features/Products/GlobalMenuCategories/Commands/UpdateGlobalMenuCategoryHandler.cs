using AutoMapper;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.GlobalMenuCategories.Commands
{
    public class UpdateGlobalMenuCategoryHandler : IRequestHandler<UpdateGlobalMenuCategoryCommand, ApiResponse>
    {
        private readonly IMapper _mapper;
        private readonly IGlobalMenuCategoryRepository _globalMenuCategoryRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateGlobalMenuCategoryHandler(
            IGlobalMenuCategoryRepository globalMenuCategoryRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _globalMenuCategoryRepository = globalMenuCategoryRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }
        public async Task<ApiResponse> Handle(UpdateGlobalMenuCategoryCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var globalMenuCategory = await _globalMenuCategoryRepository.GetByIdAsync(request.Id);

                if (globalMenuCategory == null)
                    return ApiResponse.Failure(404, "This category cannot be found");

                _mapper.Map(request, globalMenuCategory);

                globalMenuCategory.UpdatedAt = DateTime.UtcNow;

                _globalMenuCategoryRepository.Update(globalMenuCategory);

                await _unitOfWork.SaveChangesAsync();
                
                var dto = _mapper.Map<GlobalMenuCategoryDto>(globalMenuCategory);

                return ApiResponse.Success(dto, "Global Menu Category updated succesfully");
            }
            catch (Exception ex) 
            {
                await _unitOfWork.LogErrorAsync("UpadateGlobalMenuCategoryHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}
