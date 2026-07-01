using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Models;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class GetProductsHandler : IRequestHandler<GetProductsQuery, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public GetProductsHandler(IProductRepository productRepository, IUserRepository userRepository, IMapper mapper)
        {
            _productRepository = productRepository;
            _userRepository = userRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetProductsQuery request, CancellationToken cancellationToken)
        {
            Guid? userProfileId = null;
            bool isAdmin = false;
            if (request.CurrentUserId.HasValue)
            {
                var users = await _userRepository.GetAsync(
                    predicate: u => u.Id == request.CurrentUserId.Value,
                    include: q => q.Include(u => u.Profile)
                );
                var currentUser = users.FirstOrDefault();
                userProfileId = currentUser?.Profile?.Id;
                isAdmin = currentUser?.Profile?.Role == UserRole.Admin;
            }

            ProductStatus? statusFilter = null;
            if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<ProductStatus>(request.Status, true, out var statusParsed))
            {
                statusFilter = statusParsed;
            }

            Expression<Func<Product, bool>> predicate = p => 
                (isAdmin || p.Status == ProductStatus.Approved || (userProfileId != null && p.Restaurant.OwnerId == userProfileId)) &&
                (!statusFilter.HasValue || p.Status == statusFilter.Value) &&
                (!request.CategoryId.HasValue || p.CategoryId == request.CategoryId.Value) &&
                (!request.RestaurantId.HasValue || p.RestaurantId == request.RestaurantId.Value) &&
                (string.IsNullOrEmpty(request.Filter) || (p.ItemName.Contains(request.Filter) || p.Category.Title.Contains(request.Filter)));

            var products = await _productRepository.GetAsync(
                predicate: predicate,
                include: q => q.Include(p => p.Restaurant)
                               .Include(p => p.Images)
                               .Include(p => p.Category)
                               .Include(p => p.ProductToppings)
                                   .ThenInclude(pt => pt.Topping)
                               .Include(p => p.ProductSizes)
                               .Include(p => p.Reviews),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
            );

            var total = await _productRepository.GetCountAsync(predicate);
            var productDtos = _mapper.Map<IReadOnlyList<ProductDto>>(products);

            return ApiResponse.Success(productDtos, "Products retrieved successfully", total);
        }
    }
}
