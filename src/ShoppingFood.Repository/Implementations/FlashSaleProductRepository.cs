using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Repository;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Repository.Implementations
{
    public class FlashSaleProductRepository : RepositoryBase<FlashSaleProduct>, IFlashSaleProductRepository
    {
        public FlashSaleProductRepository(DbContext dbContext) : base(dbContext)
        {
        }
    }
}
