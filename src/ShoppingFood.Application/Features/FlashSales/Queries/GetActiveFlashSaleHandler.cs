using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.FlashSale;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.FlashSales.Queries
{
    public class GetActiveFlashSaleHandler : IRequestHandler<GetActiveFlashSaleQuery, ApiResponse>
    {
        private readonly IFlashSaleRepository _flashSaleRepository;
        private readonly IFlashSaleProductRepository _flashSaleProductRepository;

        public GetActiveFlashSaleHandler(
            IFlashSaleRepository flashSaleRepository,
            IFlashSaleProductRepository flashSaleProductRepository)
        {
            _flashSaleRepository = flashSaleRepository;
            _flashSaleProductRepository = flashSaleProductRepository;
        }

        public async Task<ApiResponse> Handle(GetActiveFlashSaleQuery request, CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;

            // Lấy flash sale Active hoặc Pending chưa kết thúc
            var flashSales = await _flashSaleRepository.GetAsync(
                predicate: fs => !fs.IsDeleted
                              && fs.EndDate > now
                              && (fs.Status == FlashSaleStatus.Active
                                  || fs.Status == FlashSaleStatus.Pending),
                orderBy: q => q.OrderBy(fs => fs.StartDate),
                disableTracking: true
            );

            if (!flashSales.Any())
                return ApiResponse.Success(new List<ActiveFlashSaleDto>(), "No active flash sales found.", 0);

            var flashSaleIds = flashSales.Select(fs => fs.Id).ToList();

            // Lấy sản phẩm Approved còn hàng, include Product → Images + Restaurant
            var flashSaleProducts = await _flashSaleProductRepository.GetAsync(
                predicate: fsp => flashSaleIds.Contains(fsp.FlashSaleId)
                               && fsp.Status == FlashSaleProductStatus.Approved
                               && fsp.SoldQuantity < fsp.QuantityLimit,
                include: q => q
                    .Include(fsp => fsp.Product)
                        .ThenInclude(p => p.Images)
                    .Include(fsp => fsp.Product)
                        .ThenInclude(p => p.Restaurant),
                disableTracking: true
            );

            // Group sản phẩm theo FlashSaleId để tránh N+1
            var productsByFlashSale = flashSaleProducts
                .GroupBy(fsp => fsp.FlashSaleId)
                .ToDictionary(g => g.Key, g => g.ToList());

            var dtos = flashSales.Select(fs =>
            {
                var products = productsByFlashSale.GetValueOrDefault(fs.Id, new List<FlashSaleProduct>());

                return new ActiveFlashSaleDto
                {
                    Id = fs.Id,
                    Title = fs.Title,
                    StartDate = fs.StartDate,
                    EndDate = fs.EndDate,
                    Status = fs.Status.ToString(),
                    Products = products.Select(fsp => MapToProductItemDto(fsp)).ToList()
                };
            }).ToList();

            return ApiResponse.Success(dtos, "Active flash sales retrieved successfully.", dtos.Count);
        }

        private FlashSaleProductItemDto MapToProductItemDto(FlashSaleProduct fsp)
        {
            var product = fsp.Product;

            var primaryImage = product?.Images?
                .FirstOrDefault(img => img.IsPrimary)?.ImageUrl
                ?? product?.Images?.FirstOrDefault()?.ImageUrl;

            var originalPrice = product?.Price ?? 0;
            var discountPercent = originalPrice > 0
                ? (int)Math.Round((1 - fsp.FlashSalePrice / originalPrice) * 100)
                : 0;

            return new FlashSaleProductItemDto
            {
                FlashSaleProductId = fsp.Id,
                ProductId = fsp.ProductId,
                ProductName = product?.ItemName ?? string.Empty,
                ImageUrl = primaryImage,
                RestaurantId = product?.RestaurantId ?? Guid.Empty,
                RestaurantName = product?.Restaurant?.RestaurantName ?? string.Empty,
                OriginalPrice = originalPrice,
                FlashSalePrice = fsp.FlashSalePrice,
                DiscountPercent = discountPercent,
                QuantityLimit = fsp.QuantityLimit,
                RemainingQuantity = fsp.QuantityLimit - fsp.SoldQuantity
            };
        }
    }
}
