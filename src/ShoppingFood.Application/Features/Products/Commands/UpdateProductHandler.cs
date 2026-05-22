using AutoMapper;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using ShoppingFood.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ShoppingFood.Dto.Product;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class UpdateProductHandler : IRequestHandler<UpdateProductCommand, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public UpdateProductHandler(IProductRepository productRepository, IUnitOfWork unitOfWork, IMapper mapper)
        {
            _productRepository = productRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }
        public async Task<ApiResponse> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var product = await _productRepository.GetByIdWithDetailsAsync(request.Id);

                if (product == null) 
                    return ApiResponse.Failure(400, "This dish cannot be found.");

                _mapper.Map(request, product);
                product.UpdatedAt = DateTime.UtcNow;

                if (request.ImageUrls != null)
                {
                    product.Images.Clear();
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

                if (request.Toppings != null)
                {
                    product.ProductToppings.Clear();
                    foreach (var toppingDto in request.Toppings)
                    {
                        var topping = _mapper.Map<ProductTopping>(toppingDto);
                        topping.Id = topping.Id == Guid.Empty ? Guid.NewGuid() : topping.Id;
                        topping.ProductId = product.Id;
                        product.ProductToppings.Add(topping);
                    }
                }

                if (request.Sizes != null)
                {
                    product.ProductSizes.Clear();
                    foreach (var sizeDto in request.Sizes)
                    {
                        var size = _mapper.Map<ProductSize>(sizeDto);
                        size.Id = size.Id == Guid.Empty ? Guid.NewGuid() : size.Id;
                        size.ProductId = product.Id;
                        product.ProductSizes.Add(size);
                    }
                }

                _productRepository.Update(product);
                await _unitOfWork.SaveChangesAsync();
                var productDto = _mapper.Map<ProductDto>(product);
                return ApiResponse.Success(productDto, "Update product successfully");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("UpdateProductHandler.Handle", ex);
                return ApiResponse.Failure(500, $"An error occurred: {ex.Message}");
            }
        }
    }
}
