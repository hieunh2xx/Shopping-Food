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
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.GlobalMenuCategories.Queries
{
    public class GetGlobalMenuCategoriesHandler : IRequestHandler<GetGlobalMenuCategoriesQuery, ApiResponse>
    {
        private readonly IGlobalMenuCategoryRepository _globalMenuCategoryRepository;
        private readonly IMapper _mapper;
        private readonly IUnitOfWork _unitOfWork;

        public GetGlobalMenuCategoriesHandler(
            IGlobalMenuCategoryRepository globalMenuCategoryRepository,
            IMapper mapper,
            IUnitOfWork unitOfWork)
        {
            _globalMenuCategoryRepository = globalMenuCategoryRepository;
            _mapper = mapper;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(GetGlobalMenuCategoriesQuery request, CancellationToken cancellationToken)
        {
            try
            {
                Expression<Func<GlobalMenuCategory, bool>>? predicate = request.ShowHidden ? null : (c => !c.IsHidden);
                Func<IQueryable<GlobalMenuCategory>, IOrderedQueryable<GlobalMenuCategory>> orderBy = q => q.OrderBy(c => c.SortOrder);

                var categories = await _globalMenuCategoryRepository.GetAsync(
                    predicate: predicate,
                    orderBy: orderBy,
                    take: 1000,
                    disableTracking: true
                );

                var dtos = _mapper.Map<IReadOnlyList<GlobalMenuCategoryDto>>(categories);
                return ApiResponse.Success(dtos, "Global Menu Categories retrieved successfully", dtos.Count);
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("GetGlobalMenuCategoriesHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}
