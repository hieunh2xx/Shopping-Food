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

namespace ShoppingFood.Application.Features.MenuCategories.Commands
{
    public class UpdateMenuCategoryHandler : IRequestHandler<UpdateMenuCategoryCommand, ApiResponse>
    {
        private readonly IMapper _mapper;
        private readonly IMenuCategoryRepository _menuCategoryRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateMenuCategoryHandler(IMenuCategoryRepository menuCategoryRepository, IUnitOfWork unitOfWork, IMapper mapper)
        {
            _menuCategoryRepository = menuCategoryRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(UpdateMenuCategoryCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var menuCategory = await _menuCategoryRepository.GetByIdAsync(request.Id);

                if (menuCategory == null) return ApiResponse.Failure(400, "This category cannot be found");

                _mapper.Map(request, menuCategory);

                menuCategory.UpdatedAt = DateTime.UtcNow;

                _menuCategoryRepository.Update(menuCategory);

                await _unitOfWork.SaveChangesAsync();

                var menuCategoryDto = _mapper.Map<MenuCategoryDto>(menuCategory);

                return ApiResponse.Success(menuCategoryDto, "Update Menu Category successfully");
            }
            catch (Exception ex) 
            {
                await _unitOfWork.LogErrorAsync("UpdateMenuCategoryHandler.Handle", ex);
                return ApiResponse.Failure(500, $"An error occurred: {ex.Message}");
            }
        }
    }
}
