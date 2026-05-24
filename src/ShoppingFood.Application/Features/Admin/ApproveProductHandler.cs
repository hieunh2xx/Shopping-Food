using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin
{
    public class ApproveProductHandler : IRequestHandler<ApproveProductCommand, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ApproveProductHandler(
            IProductRepository productRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _productRepository = productRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(ApproveProductCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "User is unauthorized.");

                var adminUser = await _userRepository.GetAsync(
                    predicate: u => u.Id == request.CurrentUserId.Value,
                    include: q => q.Include(u => u.Profile)
                );
                var admin = adminUser.FirstOrDefault();

                if (admin?.Profile == null || admin.Profile.Role != UserRole.Admin)
                    return ApiResponse.Failure(403, "Forbidden. Only administrator can review products.");

                var products = await _productRepository.GetAsync(
                    predicate: p => p.Id == request.ProductId,
                    include: q => q.Include(p => p.Restaurant),
                    disableTracking: false
                );
                var product = products.FirstOrDefault();

                if (product == null)
                    return ApiResponse.Failure(404, $"Product with ID '{request.ProductId}' was not found.");

                if (request.IsApproved)
                {
                    product.Status = ProductStatus.Approved;
                    product.IsHidden = false;
                }
                else
                {
                    product.Status = ProductStatus.Rejected;
                }

                product.UpdatedAt = DateTime.UtcNow;
                _productRepository.Update(product);
                await _unitOfWork.SaveChangesAsync();

                var productDto = _mapper.Map<ProductDto>(product);
                string statusMessage = request.IsApproved 
                    ? "Product has been approved successfully."
                    : "Product has been rejected.";

                return ApiResponse.Success(productDto, statusMessage);
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("ApproveProductHandler.Handle", ex);
                return ApiResponse.Failure(500, $"An error occurred: {ex.Message}");
            }
        }
    }
}
