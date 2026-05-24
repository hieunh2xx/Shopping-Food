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
            if (request.CurrentUserId.HasValue)
            {
                var users = await _userRepository.GetAsync(
                    predicate: u => u.Id == request.CurrentUserId.Value,
                    include: q => q.Include(u => u.Profile)
                );
                userProfileId = users.FirstOrDefault()?.Profile?.Id;
            }

            Expression<Func<Product, bool>> predicate = p => 
                (p.Status == ProductStatus.Approved || (userProfileId != null && p.Restaurant.OwnerId == userProfileId));

            if (request.CategoryId.HasValue)
            {
                var catId = request.CategoryId.Value;
                predicate = p => (p.Status == ProductStatus.Approved || (userProfileId != null && p.Restaurant.OwnerId == userProfileId)) && p.CategoryId == catId;
            }

            if (!string.IsNullOrEmpty(request.Filter))
            {
                var filter = request.Filter;
                if(request.CategoryId.HasValue)
                {
                    var catId = request.CategoryId.Value;
                    predicate = p => (p.Status == ProductStatus.Approved || (userProfileId != null && p.Restaurant.OwnerId == userProfileId)) &&
                                    p.CategoryId == catId &&
                                    (p.ItemName.Contains(filter) || (p.Category.Title.Contains(filter)));
                }
                else
                {
                    predicate = p => (p.Status == ProductStatus.Approved || (userProfileId != null && p.Restaurant.OwnerId == userProfileId)) &&
                                    p.ItemName.Contains(filter) && p.Category.Title.Contains(filter);
                }
            }

            var products = await _productRepository.GetAsync(
                predicate: predicate,
                include: q => q.Include(p => p.Restaurant)
                               .Include(p => p.Images)
                               .Include(p => p.Category)
                               .Include(p => p.ProductToppings)
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
