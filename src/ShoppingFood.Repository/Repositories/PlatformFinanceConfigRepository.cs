using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Repository;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Repository.Repositories
{
    public class PlatformFinanceConfigRepository : RepositoryBase<PlatformFinanceConfig>, IPlatformFinanceConfigRepository
    {
        public PlatformFinanceConfigRepository(DbContext context) : base(context)
        {
        }
    }
}
