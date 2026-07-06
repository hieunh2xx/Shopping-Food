using ShoppingFood.Application.Models;

namespace ShoppingFood.Application.Interfaces
{
    public interface IPaymentCacheService
    {
        void Set(PaymentCacheEntry entry);
        PaymentCacheEntry? GetByPaymentId(Guid paymentId);
        PaymentCacheEntry? GetByInvoice(string invoiceNumber);
        void UpdateStatus(Guid paymentId, string status);
        void Remove(Guid paymentId);
    }
}
