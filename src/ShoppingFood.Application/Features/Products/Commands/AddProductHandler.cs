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

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class AddProductHandler : IRequestHandler<AddProductCommand, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public AddProductHandler(IProductRepository productRepository, IUnitOfWork unitOfWork, IMapper mapper)
        {
            _productRepository = productRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }
        public async Task<ApiResponse> Handle(AddProductCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var product = _mapper.Map<Product>(request);
                if(product.Id == Guid.Empty) product.Id = Guid.NewGuid();
                product.CreatedAt = DateTime.UtcNow;
                product.UpdatedAt = DateTime.UtcNow;
                if (request.ImageUrls != null && request.ImageUrls.Count > 0)
                {
                    product.Images = new List<ProductImage>();
                    foreach (var url in request.ImageUrls)
                    {
                        product.Images.Add(new ProductImage
                        {
                            Id = Guid.NewGuid(),
                            ProductId = product.Id,
                            ImageUrl = url
                        });
                    }
                }

                _productRepository.Add(product);

                if (product.ProductToppings != null)
                {
                    foreach (var t in product.ProductToppings)
                    {
                        if (t.Id == Guid.Empty) t.Id = Guid.NewGuid();
                        t.ProductId = product.Id;
                    }
                }
                if (product.ProductSizes != null)
                {
                    foreach (var s in product.ProductSizes)
                    {
                        if (s.Id == Guid.Empty) s.Id = Guid.NewGuid();
                        s.ProductId = product.Id;
                    }
                }

                await _unitOfWork.SaveChangesAsync();

                var productDto = _mapper.Map<ProductDto>(product);
                return ApiResponse.Success(productDto, "Add product successfully");
            }
            catch (Exception ex) {
                await _unitOfWork.LogErrorAsync("AddProductHandler.Handle", ex);
                return ApiResponse.Failure(500, $"An error occurred: {ex.Message}");
            }
        }
    }
}
