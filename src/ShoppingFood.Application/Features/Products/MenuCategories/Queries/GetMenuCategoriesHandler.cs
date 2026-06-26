using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.MenuCategories.Queries
{
    public class GetMenuCategoriesHandler : IRequestHandler<GetMenuCategoriesQuery, ApiResponse>
    {
        private readonly IMenuCategoryRepository _menuCategoryRepository;
        private readonly IMapper _mapper;

        public GetMenuCategoriesHandler(IMenuCategoryRepository menuCategoryRepository, IMapper mapper)
        {
            _menuCategoryRepository = menuCategoryRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetMenuCategoriesQuery request, CancellationToken cancellationToken)
        {
            var categories = await _menuCategoryRepository.GetAsync(
                predicate: c => c.RestaurantId == request.RestaurantId,
                orderBy: q => q.OrderBy(c => c.SortOrder),
                include: q => q.Include(c => c.Products),
                skip: 0,
                take: 100,
                disableTracking: true
            );

            var dtos = categories.Select(c => new MenuCategoryDto
            {
                Id = c.Id,
                RestaurantId = c.RestaurantId,
                Title = c.Title,
                Description = c.Description,
                SortOrder = c.SortOrder,
                ProductCount = c.Products.Count
            }).ToList();

            return ApiResponse.Success(dtos, "Categories retrieved successfully", dtos.Count);
        }
    }
}
