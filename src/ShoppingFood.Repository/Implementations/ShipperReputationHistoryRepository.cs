using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Core.Repository;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Repository.Implementations
{
    public class ShipperReputationHistoryRepository : RepositoryBase<ShipperReputationHistory>, IShipperReputationHistoryRepository
    {
        public ShipperReputationHistoryRepository(ShoppingFoodContext dbContext) : base(dbContext)
        {
        }
    }
}
