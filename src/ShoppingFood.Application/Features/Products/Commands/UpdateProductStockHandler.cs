using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class UpdateProductStockHandler : IRequestHandler<UpdateProductStockCommand, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateProductStockHandler(IProductRepository productRepository, IUserRepository userRepository, IRestaurantProfileRepository restaurantProfileRepository, IUnitOfWork unitOfWork)
        {
            _productRepository = productRepository;
            _userRepository = userRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _unitOfWork = unitOfWork;
        }
        public async Task<ApiResponse> Handle(UpdateProductStockCommand request, CancellationToken cancellationToken)
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
                    var restaurants = await _restaurantProfileRepository.GetAsync(r => r.Id == product.RestaurantId && r.OwnerId == userProfile.Id);
                    if (!restaurants.Any())
                        return ApiResponse.Failure(403, "Access denied. You do not own this dish.");
                }
                product.StockStatus = request.StockStatus;
                product.UpdatedAt = DateTime.UtcNow;
                await _unitOfWork.SaveChangesAsync();
                return ApiResponse.Success(product, "Update StockStatus successfully");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("UpdateProductStockHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}
