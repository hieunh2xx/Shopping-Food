using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Repository;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Repository.Implementations
{
    public class OrderExplanationRequestRepository : RepositoryBase<OrderExplanationRequest>, IOrderExplanationRequestRepository
    {
        public OrderExplanationRequestRepository(ShoppingFoodContext dbContext) : base(dbContext)
        {
        }
    }
}
