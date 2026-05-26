using ShoppingFood.Core.Repository;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Repository.Implementations
{
    public class NotificationRepository : RepositoryBase<Notification>, INotificationRepository
    {
        public NotificationRepository(ShoppingFoodContext dbContext) : base(dbContext)
        {
        }
    }
}
