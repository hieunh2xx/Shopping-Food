using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class SearchProductHandler : IRequestHandler<SearchProductQuery, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly IMapper _mapper;

        public SearchProductHandler(IProductRepository productRepository, IMapper mapper)
        {
            _productRepository = productRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(SearchProductQuery request, CancellationToken cancellationToken)
        {
            var filter = request.Filter?.ToLower();
            var hasFilter = !string.IsNullOrEmpty(filter);

            Expression<Func<Product, bool>> predicate = p =>
                (!hasFilter || (
                    p.ItemName.ToLower().Contains(filter!) ||
                    (p.Description != null && p.Description.ToLower().Contains(filter!)) ||
                    p.Category.ToLower().Contains(filter!) ||
                    p.Restaurant.RestaurantName.ToLower().Contains(filter!)
                )) &&
                (!request.MinPrice.HasValue || p.Price >= request.MinPrice.Value) &&
                (!request.MaxPrice.HasValue || p.Price <= request.MaxPrice.Value) &&
                (!request.RestaurantId.HasValue || p.RestaurantId == request.RestaurantId.Value);

            Func<IQueryable<Product>, IOrderedQueryable<Product>>? orderBy = null;
            if (!string.IsNullOrEmpty(request.SortBy))
            {
                switch (request.SortBy.ToLower())
                {
                    case "priceasc":
                        orderBy = q => q.OrderBy(p => p.Price);
                        break;
                    case "pricedesc":
                        orderBy = q => q.OrderByDescending(p => p.Price);
                        break;
                    case "name":
                        orderBy = q => q.OrderBy(p => p.ItemName);
                        break;
                }
            }

            var products = await _productRepository.GetAsync(
                predicate: predicate,
                orderBy: orderBy,
                include: q => q.Include(p => p.Restaurant).Include(p => p.Images),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
            );

            var total = await _productRepository.GetCountAsync(predicate);
            var productDtos = _mapper.Map<IReadOnlyList<ProductDto>>(products);

            return ApiResponse.Success(productDtos, "Search results retrieved successfully", total);
        }
    }
}
