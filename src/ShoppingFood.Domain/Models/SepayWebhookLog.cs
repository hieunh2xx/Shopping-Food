namespace ShoppingFood.Domain.Models
{
    /// <summary>
    /// Idempotency log for SePay IPN and bank webhooks.
    /// </summary>
    public class SepayWebhookLog
    {
        public Guid Id { get; set; }
        /// <summary>Unique key e.g. ipn:ORDER_PAID:order_id or wh:92704</summary>
        public string EventKey { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public string RawPayload { get; set; } = string.Empty;
        public Guid? PaymentSessionId { get; set; }
        public bool IsProcessed { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
