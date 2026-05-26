using AutoMapper;
using MediatR;
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

namespace ShoppingFood.Application.Features.Products.GlobalMenuCategories.Commands
{
    public class AddGlobalMenuCategoryHandler : IRequestHandler<AddGlobalMenuCategoryCommand, ApiResponse>
    {
        private readonly IGlobalMenuCategoryRepository _globalMenuCategoryRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public AddGlobalMenuCategoryHandler(
            IGlobalMenuCategoryRepository globalMenuCategoryRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _globalMenuCategoryRepository = globalMenuCategoryRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }
        public async Task<ApiResponse> Handle(AddGlobalMenuCategoryCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var globalMenuCateogory = _mapper.Map<GlobalMenuCategory>(request);
                globalMenuCateogory.Id = Guid.NewGuid();
                globalMenuCateogory.CreatedAt = DateTime.UtcNow;
                globalMenuCateogory.UpdatedAt = DateTime.UtcNow;

                _globalMenuCategoryRepository.Add(globalMenuCateogory);
                await _unitOfWork.SaveChangesAsync();
                var dto = _mapper.Map<GlobalMenuCategoryDto>(globalMenuCateogory);

                return ApiResponse.Success(dto, "Global Menu Category added successfully");
            }
            catch (Exception ex) 
            {
                await _unitOfWork.LogErrorAsync("AddGlobalMenuCategoryHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}
