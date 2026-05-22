using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;

namespace ShoppingFood.Repository.Interfaces
{
    public interface IProductRepository : IAsyncRepository<Product>
    {
        Task<IReadOnlyList<Product>> GetBestSellersAsync(int top);
        Task<List<string>> GetCategoriesAsync();
        Task<Product?> GetByIdWithDetailsAsync(Guid id);
    }
}
