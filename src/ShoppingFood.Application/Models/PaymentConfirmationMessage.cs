namespace ShoppingFood.Application.Models
{
    public class PaymentConfirmationMessage
    {
        public string EventKey { get; set; } = string.Empty;
        public string InvoiceNumber { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Source { get; set; } = string.Empty;
        public string? ExternalTransactionId { get; set; }
        public Guid? WebhookLogId { get; set; }
        public DateTime EnqueuedAt { get; set; } = DateTime.UtcNow;
    }
}
