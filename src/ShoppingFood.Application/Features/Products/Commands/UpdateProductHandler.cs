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
                    return ApiResponse.Failure(404, "This dish cannot be found.");

                _mapper.Map(request, product);
                product.UpdatedAt = DateTime.UtcNow;

                UpdateImages(product, request.ImageUrls);
                UpdateToppings(product, request.ToppingIds);
                UpdateSizes(product, request.Sizes);

                _productRepository.Update(product);
                await _unitOfWork.SaveChangesAsync();
                var productDto = _mapper.Map<ProductDto>(product);
                return ApiResponse.Success(productDto, "Update product successfully");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("UpdateProductHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private void UpdateImages(Product product, List<string>? imageUrls)
        {
            if (imageUrls == null) return;

            product.Images.Clear();
            foreach (var url in imageUrls)
            {
                product.Images.Add(new ProductImage
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    ImageUrl = url
                });
            }
        }

        private void UpdateToppings(Product product, List<Guid>? toppingIds)
        {
            if (toppingIds == null) return;

            product.ProductToppings.Clear();
            foreach (var toppingId in toppingIds)
            {
                product.ProductToppings.Add(new ProductTopping
                {
                    ProductId = product.Id,
                    ToppingId = toppingId
                });
            }
        }

        private void UpdateSizes(Product product, List<ProductSizeDto>? sizes)
        {
            if (sizes == null) return;

            product.ProductSizes.Clear();
            foreach (var sizeDto in sizes)
            {
                var size = _mapper.Map<ProductSize>(sizeDto);
                size.Id = size.Id == Guid.Empty ? Guid.NewGuid() : size.Id;
                size.ProductId = product.Id;
                product.ProductSizes.Add(size);
            }
        }
    }
}
