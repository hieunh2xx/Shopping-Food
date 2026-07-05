using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly ICartItemRepository _cartItemRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DeleteProductCommandHandler(
            IProductRepository productRepository, 
            ICartItemRepository cartItemRepository,
            IOrderRepository orderRepository,
            IUnitOfWork unitOfWork)
        {
            _productRepository = productRepository;
            _cartItemRepository = cartItemRepository;
            _orderRepository = orderRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var product = await _productRepository.GetByIdAsync(request.Id);

                if (product == null) 
                    return ApiResponse.Failure(404, "This dish cannot be found.");


                product.IsDeleted = true;
                _productRepository.Update(product);
                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(null, "Delete product successfully");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("DeleteProductCommandHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}
