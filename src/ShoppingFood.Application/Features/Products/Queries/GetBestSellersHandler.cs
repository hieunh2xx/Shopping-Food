using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Context;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class GetBestSellersHandler : IRequestHandler<GetBestSellersQuery, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly IMapper _mapper;

        public GetBestSellersHandler(IProductRepository productRepository, IMapper mapper)
        {
            _productRepository = productRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetBestSellersQuery request, CancellationToken cancellationToken)
        {
            
            var products = await _productRepository.GetBestSellersAsync(request.Take);

            var productDtos = _mapper.Map<IReadOnlyList<ProductDto>>(products);

            return ApiResponse.Success(productDtos, total: productDtos.Count);
        }
    }
}
