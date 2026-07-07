using ShoppingFood.Core.Repository;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Repository.Implementations
{
    public class ApiEndpointRepository : RepositoryBase<ApiEndpoint>, IApiEndpointRepository
    {
        public ApiEndpointRepository(ShoppingFoodContext dbContext) : base(dbContext)
        {
        }
    }
}
