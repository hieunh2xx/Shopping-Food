using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class DeleteProductHandler : IRequestHandler<DeleteProductQuery, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DeleteProductHandler(IProductRepository productRepository, IUnitOfWork unitOfWork)
        {
            _productRepository = productRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(DeleteProductQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var product = await _productRepository.GetByIdAsync(request.Id);

                if (product == null) 
                    return ApiResponse.Failure(404, "This dish cannot be found.");

                _productRepository.Delete(product);
                var result = await _unitOfWork.SaveChangesAsync();

                if (result < 0)
                    return ApiResponse.Failure(500, "Error occurred while deleting the dish.");
                

                return ApiResponse.Success(null, "Delete product successfully");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("DeleteProductHandler.Handle", ex);
                return ApiResponse.Failure(500, $"An error occurred: {ex.Message}");
            }
        }
    }
}
