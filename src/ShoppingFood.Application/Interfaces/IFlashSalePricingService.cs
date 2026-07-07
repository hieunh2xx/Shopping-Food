using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Product;

namespace ShoppingFood.Application.Interfaces
{
    public interface IFlashSalePricingService
    {
        Task<decimal?> GetActiveFlashSalePriceAsync(Guid productId);
        Task<Dictionary<Guid, decimal>> GetActiveFlashSalePricesAsync(IEnumerable<Guid> productIds);
        Task AttachFlashSalePricesAsync(IEnumerable<ProductDto> products);
        Task SyncCartItemPricesAsync(Cart cart);
    }
}
