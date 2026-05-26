using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Repository;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Repository.Implementations
{
    public class ToppingRepository : RepositoryBase<Topping>, IToppingRepository
    {
        public ToppingRepository(DbContext dbContext) : base(dbContext)
        {
        }
    }
}
