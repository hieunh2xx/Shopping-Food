using ShoppingFood.Application.Models;

namespace ShoppingFood.Application.Interfaces
{
    public interface IPaymentMessageQueue
    {
        ValueTask EnqueueAsync(PaymentConfirmationMessage message, CancellationToken ct = default);
        IAsyncEnumerable<PaymentConfirmationMessage> ReadAllAsync(CancellationToken ct);
        int PendingCount { get; }
    }
}
