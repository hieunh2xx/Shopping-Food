using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Repository;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Repository.Implementations
{
    public class ShipperProfileRepository : RepositoryBase<ShipperProfile>, IShipperProfileRepository
    {
        public ShipperProfileRepository(DbContext dbContext) : base(dbContext)
        {
        }
    }
}
