using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Threading;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Dto.Product;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class ToggleProductVisibilityHandler : IRequestHandler<ToggleProductVisibilityCommand, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ToggleProductVisibilityHandler(IProductRepository productRepository, IUserRepository userRepository, IRestaurantProfileRepository restaurantProfileRepository, IUnitOfWork unitOfWork, IMapper mapper)
        {
            _productRepository = productRepository;
            _userRepository = userRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
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
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}
