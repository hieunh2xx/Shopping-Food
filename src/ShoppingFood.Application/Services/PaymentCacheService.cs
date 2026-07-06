using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Application.Models;
using ShoppingFood.Application.Options;

namespace ShoppingFood.Application.Services
{
    public class PaymentCacheService : IPaymentCacheService
    {
        private readonly IMemoryCache _cache;
        private readonly SepayOptions _options;

        public PaymentCacheService(IMemoryCache cache, IOptions<SepayOptions> options)
        {
            _cache = cache;
            _options = options.Value;
        }

        private static string IdKey(Guid id) => $"pay:id:{id}";
        private static string InvKey(string inv) => $"pay:inv:{inv}";

        public void Set(PaymentCacheEntry entry)
        {
            var ttl = entry.ExpiresAt - DateTime.UtcNow;
            if (ttl < TimeSpan.Zero) ttl = TimeSpan.FromMinutes(1);
            var buffer = TimeSpan.FromMinutes(_options.QrExpiryMinutes + 2);
            var options = new MemoryCacheEntryOptions().SetAbsoluteExpiration(ttl + buffer);

            _cache.Set(IdKey(entry.PaymentId), entry, options);
            _cache.Set(InvKey(entry.InvoiceNumber), entry.PaymentId, options);
        }

        public PaymentCacheEntry? GetByPaymentId(Guid paymentId)
        {
            return _cache.TryGetValue(IdKey(paymentId), out PaymentCacheEntry? entry) ? entry : null;
        }

        public PaymentCacheEntry? GetByInvoice(string invoiceNumber)
        {
            if (!_cache.TryGetValue(InvKey(invoiceNumber), out Guid paymentId))
                return null;
            return GetByPaymentId(paymentId);
        }

        public void UpdateStatus(Guid paymentId, string status)
        {
            var entry = GetByPaymentId(paymentId);
            if (entry == null) return;
            entry.Status = status;
            Set(entry);
        }

        public void Remove(Guid paymentId)
        {
            var entry = GetByPaymentId(paymentId);
            if (entry != null)
            {
                _cache.Remove(InvKey(entry.InvoiceNumber));
            }
            _cache.Remove(IdKey(paymentId));
        }
    }
}
