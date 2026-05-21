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
    public class GetProductsHandler : IRequestHandler<GetProductsQuery, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly IMapper _mapper;

        public GetProductsHandler(IProductRepository productRepository, IMapper mapper)
        {
            _productRepository = productRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetProductsQuery request, CancellationToken cancellationToken)
        {
            Expression<Func<Product, bool>> predicate = p => true;

            if (!string.IsNullOrEmpty(request.Filter))
            {
                predicate = p => p.ItemName.Contains(request.Filter) || p.Category.Contains(request.Filter);
            }

            var products = await _productRepository.GetAsync(
                predicate: predicate,
                include: q => q.Include(p => p.Restaurant).Include(p => p.Images),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
            );

            var total = await _productRepository.GetCountAsync(predicate);
            var productDtos = _mapper.Map<IReadOnlyList<ProductDto>>(products);

            return ApiResponse.Success(productDtos, "Products retrieved successfully", total);
        }
    }
}
