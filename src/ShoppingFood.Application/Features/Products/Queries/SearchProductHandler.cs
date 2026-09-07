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
using ShoppingFood.Application.Interfaces;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class SearchProductHandler : IRequestHandler<SearchProductQuery, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;
        private readonly IFlashSalePricingService _flashSalePricingService;

        public SearchProductHandler(
            IProductRepository productRepository,
            IUserRepository userRepository,
            IMapper mapper,
            IFlashSalePricingService flashSalePricingService)
        {
            _productRepository = productRepository;
            _userRepository = userRepository;
            _mapper = mapper;
            _flashSalePricingService = flashSalePricingService;
        }

        public async Task<ApiResponse> Handle(SearchProductQuery request, CancellationToken cancellationToken)
        {
            var filter = request.Filter?.ToLower();
            var hasFilter = !string.IsNullOrEmpty(filter);

            double? latMin = null;
            double? latMax = null;
            double? lonMin = null;
            double? lonMax = null;

            if (request.UserLatitude.HasValue && request.UserLongitude.HasValue && request.MaxDistanceInKm.HasValue)
            {
                var userLat = request.UserLatitude.Value;
                var userLon = request.UserLongitude.Value;
                var maxDist = request.MaxDistanceInKm.Value;

                var latDiff = maxDist / 111.0;
                latMin = userLat - latDiff;
                latMax = userLat + latDiff;

                var lonDiff = maxDist / (111.0 * Math.Cos(userLat * Math.PI / 180.0));
                lonMin = userLon - lonDiff;
                lonMax = userLon + lonDiff;
            }

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
                (isAdmin || (p.Status == ProductStatus.Approved && !p.IsHidden)) &&
                (!statusFilter.HasValue || p.Status == statusFilter.Value) &&
                (!hasFilter || (
                    request.RestaurantId.HasValue
                        // Seller context: only search product name and description
                        ? (p.ItemName.ToLower().Contains(filter!) ||
                           (p.Description != null && p.Description.ToLower().Contains(filter!)))
                        // Customer context: search across only food fields
                        : (p.ItemName.ToLower().Contains(filter!) ||
                           (p.Description != null && p.Description.ToLower().Contains(filter!)))
                )) &&
                (!request.CategoryId.HasValue || p.CategoryId == request.CategoryId.Value) &&
                (!request.GlobalCategoryId.HasValue || p.GlobalCategoryId == request.GlobalCategoryId.Value) &&
                (!request.MinPrice.HasValue || p.Price >= request.MinPrice.Value) &&
                (!request.MaxPrice.HasValue || p.Price <= request.MaxPrice.Value) &&
                (!request.RestaurantId.HasValue || p.RestaurantId == request.RestaurantId.Value) &&
                (!request.MinRating.HasValue || (p.Reviews.Any() && p.Reviews.Average(r => r.Rating) >= request.MinRating.Value)) &&
                (!request.IsFreeship.HasValue || p.IsFreeship == request.IsFreeship.Value) &&
                (!latMin.HasValue || !latMax.HasValue || !lonMin.HasValue || !lonMax.HasValue || (
                    p.Restaurant.Latitude.HasValue && p.Restaurant.Longitude.HasValue &&
                    p.Restaurant.Latitude.Value >= latMin.Value && p.Restaurant.Latitude.Value <= latMax.Value &&
                    p.Restaurant.Longitude.Value >= lonMin.Value && p.Restaurant.Longitude.Value <= lonMax.Value
                ));

            Func<IQueryable<Product>, IOrderedQueryable<Product>>? orderBy = null;
            if (!string.IsNullOrEmpty(request.SortBy))
            {
                switch (request.SortBy.ToLower())
                {
                    case "priceasc":
                        orderBy = q => q.OrderBy(p => p.Price);
                        break;
                    case "pricedesc":
                        orderBy = q => q.OrderByDescending(p => p.Price);
                        break;
                    case "name":
                        orderBy = q => q.OrderBy(p => p.ItemName);
                        break;
                }
            }

            var products = await _productRepository.GetAsync(
                predicate: predicate,
                orderBy: orderBy,
                include: q => q.Include(p => p.Restaurant)
                               .Include(p => p.Images)
                               .Include(p => p.Category)
                               .Include(p => p.GlobalCategory)
                               .Include(p => p.Reviews)
                               .Include(p => p.ProductToppings).ThenInclude(pt => pt.Topping)
                               .Include(p => p.ProductSizes),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
            );

            var total = await _productRepository.GetCountAsync(predicate);
            var productDtos = _mapper.Map<IReadOnlyList<ProductDto>>(products);

            await _flashSalePricingService.AttachFlashSalePricesAsync(productDtos);

            return ApiResponse.Success(productDtos, "Products retrieved successfully", total);
        }
    }
}
