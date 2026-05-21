using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using ShoppingFood.Dto.Product;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class ToggleProductVisibilityHandler : IRequestHandler<ToggleProductVisibilityCommand, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ToggleProductVisibilityHandler(IProductRepository productRepository, IUnitOfWork unitOfWork, IMapper mapper)
        {
            _productRepository = productRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(ToggleProductVisibilityCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var product = await _productRepository.GetByIdAsync(request.Id);
                if (product == null)
                    return ApiResponse.Failure(404, "Product not found.");

                product.IsHidden = !product.IsHidden;
                product.UpdatedAt = DateTime.UtcNow;

                _productRepository.Update(product);
                await _unitOfWork.SaveChangesAsync();

                var productDto = _mapper.Map<ProductDto>(product);
                string message = product.IsHidden ? "Product has been hidden." : "Product is now visible.";
                
                return ApiResponse.Success(productDto, message);
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("ToggleProductVisibilityHandler.Handle", ex);
                return ApiResponse.Failure(500, $"An error occurred: {ex.Message}");
            }
        }
    }
}
