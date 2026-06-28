using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class UpdateProductAvailabilityHandler : IRequestHandler<UpdateProductAvailabilityCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IProductRepository _productRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public UpdateProductAvailabilityHandler(
            IUserRepository userRepository,
            IProductRepository productRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _userRepository = userRepository;
            _productRepository = productRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(UpdateProductAvailabilityCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (request.CurrentUserId == null)
                    return ApiResponse.Failure(401, "Unauthorized access.");

                var users = await _userRepository.GetAsync(
                    predicate: u => u.Id == request.CurrentUserId,
                    include: q => q.Include(u => u.Profile)
                );
                var user = users.FirstOrDefault();
                if (user == null || user.Profile == null)
                    return ApiResponse.Failure(404, "User profile not found.");

                var products = await _productRepository.GetAsync(
                    predicate: p => p.Id == request.Id,
                    include: q => q.Include(p => p.Restaurant),
                    disableTracking: false
                );
                var product = products.FirstOrDefault();

                if (product == null)
                    return ApiResponse.Failure(404, "This dish cannot be found.");

                if (product.Restaurant == null || product.Restaurant.OwnerId != user.Profile.Id)
                    return ApiResponse.Failure(403, "Forbidden. You do not own this restaurant.");

                product.AvailableFrom = request.AvailableFrom;
                product.AvailableTo = request.AvailableTo;
                product.UpdatedAt = DateTime.UtcNow;

                await _unitOfWork.SaveChangesAsync();

                var productDto = _mapper.Map<ProductDto>(product);
                return ApiResponse.Success(productDto, "Update time available successfully");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("UpdateProductAvailabilityHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}
