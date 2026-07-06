using ShoppingFood.Application.Models;
using ShoppingFood.Domain.Models;

namespace ShoppingFood.Application.Interfaces
{
    public interface IPaymentOrchestrationService
    {
        Task RegisterPaymentCacheAsync(PaymentSession session, string? qrImageUrl = null);
        Task<Guid> PersistWebhookAndEnqueueAsync(string eventKey, string eventType, string rawPayload, PaymentConfirmationMessage? confirmation = null);
        Task<bool> ProcessConfirmationAsync(PaymentConfirmationMessage message);
        Task ExpireStaleSessionsAsync();
        Task ReplayUnprocessedWebhooksAsync();
    }
}
