using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Repository;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Repository.Implementations
{
    public class SystemReportRepository : RepositoryBase<SystemReport>, ISystemReportRepository
    {
        public SystemReportRepository(ShoppingFoodContext dbContext) : base(dbContext)
        {
        }
    }
}
