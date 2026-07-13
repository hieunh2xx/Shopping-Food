using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class GetRecommendationsHandler : IRequestHandler<GetRecommendationsQuery, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IProductRepository _productRepository;
        private readonly IMapper _mapper;
        private readonly IFlashSalePricingService _flashSalePricingService;

        public GetRecommendationsHandler(
            IOrderRepository orderRepository,
            IProductRepository productRepository,
            IMapper mapper,
            IFlashSalePricingService flashSalePricingService)
        {
            _orderRepository = orderRepository;
            _productRepository = productRepository;
            _mapper = mapper;
            _flashSalePricingService = flashSalePricingService;
        }

        public async Task<ApiResponse> Handle(GetRecommendationsQuery request, CancellationToken cancellationToken)
        {
            var recommendedProducts = new List<ProductRecommendationDto>();
            var recentOrderedProductIds = new HashSet<Guid>();
            
            if (request.CurrentUserId.HasValue && request.CurrentUserId.Value != Guid.Empty)
            {
                var ninetyDaysAgo = DateTime.UtcNow.AddDays(-90);
                var recentOrders = await _orderRepository.GetAsync(
                    predicate: o => o.UserAccountId == request.CurrentUserId && o.CreatedAt >= ninetyDaysAgo && o.Status != OrderStatus.Cancelled,
                    include: q => q.Include(o => o.Items).ThenInclude(i => i.Product)
                );

                if (recentOrders.Any())
                {
                    var frequencyMap = new Dictionary<Guid, int>();
                    var categoryFrequencyMap = new Dictionary<Guid, int>();
                    var restaurantFrequencyMap = new Dictionary<Guid, int>();

                    foreach (var order in recentOrders)
                    {
                        var isRecent14Days = order.CreatedAt >= DateTime.UtcNow.AddDays(-14);
                        foreach (var item in order.Items)
                        {
                            if (item.ProductId.HasValue && item.Product != null)
                            {
                                var pId = item.ProductId.Value;
                                
                                if (isRecent14Days)
                                {
                                    recentOrderedProductIds.Add(pId);
                                }

                                if (frequencyMap.ContainsKey(pId))
                                    frequencyMap[pId] += item.Quantity;
                                else
                                    frequencyMap[pId] = item.Quantity;

                                if (item.Product.GlobalCategoryId.HasValue)
                                {
                                    var catId = item.Product.GlobalCategoryId.Value;
                                    if (categoryFrequencyMap.ContainsKey(catId))
                                        categoryFrequencyMap[catId]++;
                                    else
                                        categoryFrequencyMap[catId] = 1;
                                }

                                var resId = item.Product.RestaurantId;
                                if (restaurantFrequencyMap.ContainsKey(resId))
                                    restaurantFrequencyMap[resId]++;
                                else
                                    restaurantFrequencyMap[resId] = 1;
                            }
                        }
                    }

                    var topCategories = categoryFrequencyMap.OrderByDescending(k => k.Value).Take(3).Select(k => k.Key).ToList();
                    var topRestaurants = restaurantFrequencyMap.OrderByDescending(k => k.Value).Take(3).Select(k => k.Key).ToList();

                    // Candidate pool
                    var candidates = await _productRepository.GetAsync(
                        predicate: p => p.Status == ProductStatus.Approved && !p.IsHidden && !p.IsDeleted && p.StockStatus == StockStatus.InStock && 
                                        !recentOrderedProductIds.Contains(p.Id) &&
                                        (frequencyMap.Keys.Contains(p.Id) || (p.GlobalCategoryId.HasValue && topCategories.Contains(p.GlobalCategoryId.Value)) || topRestaurants.Contains(p.RestaurantId)),
                        include: q => q.Include(p => p.Images).Include(p => p.GlobalCategory).Include(p => p.Category).Include(p => p.Restaurant).Include(p => p.Reviews)
                    );

                    var candidateDtos = _mapper.Map<List<ProductRecommendationDto>>(candidates);
                    await _flashSalePricingService.AttachFlashSalePricesAsync(candidateDtos.Cast<ProductDto>().ToList());

                    foreach (var candidate in candidateDtos)
                    {
                        double score = 0;

                        if (frequencyMap.TryGetValue(candidate.Id, out int freq))
                        {
                            score += freq * 3;
                            candidate.ReasonTag = "frequently_ordered";
                        }

                        if (candidate.GlobalCategoryId.HasValue && topCategories.Contains(candidate.GlobalCategoryId.Value))
                        {
                            score += 2;
                            if (string.IsNullOrEmpty(candidate.ReasonTag))
                                candidate.ReasonTag = "trending_category";
                        }

                        if (candidate.FlashSalePrice.HasValue)
                        {
                            score += 1.5;
                            if (string.IsNullOrEmpty(candidate.ReasonTag))
                                candidate.ReasonTag = "flash_sale";
                        }

                        score += candidate.AverageRating * 0.2;

                        if (string.IsNullOrEmpty(candidate.ReasonTag))
                        {
                            if (candidate.AverageRating >= 4.5)
                                candidate.ReasonTag = "top_rated";
                            else
                                candidate.ReasonTag = "trending_category";
                        }

                        candidate.ScoreRank = (int)(score * 100);
                        recommendedProducts.Add(candidate);
                    }
                }
            }

            // Fallback to best sellers if no recommendations found or not logged in
            if (!recommendedProducts.Any())
            {
                var bestSellers = await _productRepository.GetBestSellersAsync(request.Take);
                var bestSellerDtos = _mapper.Map<List<ProductRecommendationDto>>(bestSellers);
                await _flashSalePricingService.AttachFlashSalePricesAsync(bestSellerDtos.Cast<ProductDto>().ToList());
                
                foreach (var dto in bestSellerDtos)
                {
                    dto.ReasonTag = dto.FlashSalePrice.HasValue ? "flash_sale" : (dto.AverageRating >= 4.5 ? "top_rated" : "trending_category");
                    dto.ScoreRank = 0;
                }
                
                return ApiResponse.Success(bestSellerDtos, total: bestSellerDtos.Count);
            }

            var finalRecommendations = recommendedProducts.OrderByDescending(r => r.ScoreRank).Take(request.Take).ToList();
            return ApiResponse.Success(finalRecommendations, total: finalRecommendations.Count);
        }
    }
}
