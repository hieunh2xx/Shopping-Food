using ShoppingFood.Core.Repository;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Repository.Implementations
{
    public class OrderDispatchHistoryRepository : RepositoryBase<OrderDispatchHistory>, IOrderDispatchHistoryRepository
    {
        public OrderDispatchHistoryRepository(ShoppingFoodContext dbContext) : base(dbContext)
        {
        }
    }
}
