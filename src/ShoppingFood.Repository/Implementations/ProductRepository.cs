using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Repository;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Repository.Implementations
{
    public class ProductRepository : RepositoryBase<Product>, IProductRepository
    {
        public ProductRepository(ShoppingFoodContext dbContext) : base(dbContext)
        {
        }

        public async Task<IReadOnlyList<Product>> GetBestSellersAsync(int top)
        {
            var dbContext = (ShoppingFoodContext)_dbContext;

            var bestSellerIds = await dbContext.OrderItems
                .Where(oi => oi.ProductId != null)
                .GroupBy(oi => oi.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    TotalQuantity = g.Sum(oi => oi.Quantity)
                })
                .OrderByDescending(x => x.TotalQuantity)
                .Take(top)
                .Select(x => x.ProductId)
                .ToListAsync();

            var products = await dbContext.Products
                .Include(p => p.Restaurant)
                .Include(p => p.Images)
                .Where(p => bestSellerIds.Contains(p.Id))
                .ToListAsync();

            return bestSellerIds
                .Select(id => products.First(p => p.Id == id))
                .ToList();
        }

        public async Task<List<string>> GetCategoriesAsync()
        {
            return await _dbContext.Set<Product>()
                .Select(p => p.Category)
                .Distinct()
                .ToListAsync();
        }
    }
}
