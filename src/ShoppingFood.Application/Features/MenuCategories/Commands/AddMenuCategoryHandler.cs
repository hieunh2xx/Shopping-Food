using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Mvc.Filters;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.MenuCategories.Commands
{
    public class AddMenuCategoryHandler : IRequestHandler<AddMenuCategoryCommand, ApiResponse>
    {
        private readonly IMenuCategoryRepository _menuCategoryRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public AddMenuCategoryHandler(IMenuCategoryRepository menuCategoryRepository, IUnitOfWork unitOfWork, IMapper mapper) 
        {
            _menuCategoryRepository = menuCategoryRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }
        public async Task<ApiResponse> Handle(AddMenuCategoryCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var menuCategory = _mapper.Map<MenuCategory>(request);

                if(menuCategory.Id == Guid.Empty) menuCategory.Id = Guid.NewGuid();
                menuCategory.CreatedAt = DateTime.UtcNow;
                menuCategory.UpdatedAt = DateTime.UtcNow;

                _menuCategoryRepository.Add(menuCategory);
                await _unitOfWork.SaveChangesAsync();

                var menuCategoryDto = _mapper.Map<MenuCategoryDto>(menuCategory);
                return ApiResponse.Success(menuCategoryDto, "Add Menu Category successfully");
            }
            catch (Exception ex) 
            {
                await _unitOfWork.LogErrorAsync("AddMenuCategoryHandler.Handle", ex);
                return ApiResponse.Failure(500, $"An error occurred: {ex.Message}");
            }
        }
    }
}
