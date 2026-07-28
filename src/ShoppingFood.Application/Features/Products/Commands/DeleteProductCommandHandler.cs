using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Domain.Enums;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly ICartItemRepository _cartItemRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DeleteProductCommandHandler(
            IProductRepository productRepository, 
            ICartItemRepository cartItemRepository,
            IOrderRepository orderRepository,
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            IUnitOfWork unitOfWork)
        {
            _productRepository = productRepository;
            _cartItemRepository = cartItemRepository;
            _orderRepository = orderRepository;
            _userRepository = userRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var product = await _productRepository.GetByIdAsync(request.Id);

                if (product == null) 
                    return ApiResponse.Failure(404, "This dish cannot be found.");

                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var user = await _userRepository.GetAsync(u => u.Id == request.CurrentUserId.Value, include: q => q.Include(u => u.Profile));
                var userProfile = user.FirstOrDefault()?.Profile;
                if (userProfile == null)
                    return ApiResponse.Failure(401, "Unauthorized.");

                if (userProfile.Role != UserRole.Admin)
                {
                    var restaurants = await _restaurantProfileRepository.GetAsync(r => r.OwnerId == userProfile.Id && r.Id == product.RestaurantId);
                    if (!restaurants.Any())
                        return ApiResponse.Failure(403, "Access denied. You do not own this dish.");
                }


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
