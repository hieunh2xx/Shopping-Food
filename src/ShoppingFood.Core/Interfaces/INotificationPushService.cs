namespace ShoppingFood.Core.Interfaces
{
    public interface INotificationPushService
    {
        Task PushToUserAsync(Guid userId, object payload, CancellationToken cancellationToken = default);
    }
}
