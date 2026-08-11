using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Services
{
    public class FlashSalePricingService : IFlashSalePricingService
    {
        private readonly IFlashSaleProductRepository _flashSaleProductRepository;
        private readonly ICartItemRepository _cartItemRepository;
        
        public FlashSalePricingService(
            IFlashSaleProductRepository flashSaleProductRepository,
            ICartItemRepository cartItemRepository)
        {
            _flashSaleProductRepository = flashSaleProductRepository;
            _cartItemRepository = cartItemRepository;
        }

        public async Task<decimal?> GetActiveFlashSalePriceAsync(Guid productId)
        {
            var now = DateTime.UtcNow;
            var activeFlashSale = await _flashSaleProductRepository.GetAsync(
                predicate: fsp => fsp.ProductId == productId &&
                                  fsp.Status == FlashSaleProductStatus.Approved &&
                                  fsp.FlashSale.StartDate <= now &&
                                  fsp.FlashSale.EndDate >= now &&
                                  !fsp.FlashSale.IsDeleted,
                include: q => q.Include(fsp => fsp.FlashSale),
                disableTracking: true
            );

            return activeFlashSale.FirstOrDefault()?.FlashSalePrice;
        }

        public async Task<Dictionary<Guid, decimal>> GetActiveFlashSalePricesAsync(IEnumerable<Guid> productIds)
        {
            var distinctIds = productIds.Distinct().ToList();
            if (!distinctIds.Any()) return new Dictionary<Guid, decimal>();

            var now = DateTime.UtcNow;
            var activeFlashSales = await _flashSaleProductRepository.GetAsync(
                predicate: fsp => distinctIds.Contains(fsp.ProductId) &&
                                  fsp.Status == FlashSaleProductStatus.Approved &&
                                  fsp.FlashSale.StartDate <= now &&
                                  fsp.FlashSale.EndDate >= now &&
                                  !fsp.FlashSale.IsDeleted,
                include: q => q.Include(fsp => fsp.FlashSale),
                disableTracking: true
            );

            return activeFlashSales.ToDictionary(f => f.ProductId, f => f.FlashSalePrice);
        }

        public async Task AttachFlashSalePricesAsync(IEnumerable<ProductDto> products)
        {
            var productIds = products.Select(p => p.Id).ToList();
            var prices = await GetActiveFlashSalePricesAsync(productIds);

            foreach (var product in products)
            {
                if (prices.TryGetValue(product.Id, out var fsp))
                {
                    product.FlashSalePrice = fsp;
                }
            }
        }

        public async Task SyncCartItemPricesAsync(Cart cart)
        {
            if (cart == null || cart.Items == null || !cart.Items.Any()) return;

            var productIds = cart.Items.Select(i => i.ProductId).Distinct().ToList();
            var flashSalePrices = await GetActiveFlashSalePricesAsync(productIds);

            bool needsUpdate = false;
            foreach (var item in cart.Items)
            {
                if (item.Product == null) continue;
                // Món tặng Mua X Tặng Y luôn giữ giá 0
                if (item.IsGift)
                {
                    if (item.PriceAtAdded != 0)
                    {
                        item.PriceAtAdded = 0;
                        _cartItemRepository.Update(item);
                        needsUpdate = true;
                    }
                    continue;
                }

                decimal baseExpectedPrice = flashSalePrices.TryGetValue(item.ProductId, out var fsp)
                                            ? fsp : item.Product.Price;
                // Cộng lại phần surcharge từ topping/size để không bị mất sau khi sync
                decimal expectedPrice = baseExpectedPrice + item.ToppingAndSizeSurcharge;

                if (item.PriceAtAdded != expectedPrice)
                {
                    item.PriceAtAdded = expectedPrice;
                    _cartItemRepository.Update(item);
                    needsUpdate = true;
                }
            }
            
            // We just call Update on repo, caller (Handler) is responsible for UnitOfWork.SaveChangesAsync()
        }
    }
}
