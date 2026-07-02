using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Repository;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Repository.Implementations
{
    public class ShipperReviewRepository : RepositoryBase<ShipperReview>, IShipperReviewRepository
    {
        public ShipperReviewRepository(DbContext dbContext) : base(dbContext) { }
    }
}
