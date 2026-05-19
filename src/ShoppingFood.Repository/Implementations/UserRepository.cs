using ShoppingFood.Core.Repository;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Repository.Implementations
{
    public class UserRepository : RepositoryBase<User>, IUserRepository
    {
        public UserRepository(ShoppingFoodContext dbContext) : base(dbContext)
        {
        }
    }
}
