using System;
using System.Collections.Generic;
using System.Linq;
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
    public class GetProductDetailHandler : IRequestHandler<GetProductDetailQuery, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly IMapper _mapper;

        public GetProductDetailHandler(IProductRepository productRepository, IMapper mapper)
        {
            _productRepository = productRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetProductDetailQuery request, CancellationToken cancellationToken)
        {
            var products = await _productRepository.GetAsync(
                predicate: p => p.Id == request.Id,
                include: q => q.Include(p => p.Restaurant)
                               .Include(p => p.Images)
                               .Include(p => p.ProductToppings)
                               .Include(p => p.ProductSizes),
                disableTracking: true
            );

            var product = products.FirstOrDefault();

            if (product == null)
            {
                throw new KeyNotFoundException($"Product with ID '{request.Id}' was not found.");
            }

            var productDto = _mapper.Map<ProductDto>(product);

            return ApiResponse.Success(productDto, "Product detail retrieved successfully");
        }
    }
}
