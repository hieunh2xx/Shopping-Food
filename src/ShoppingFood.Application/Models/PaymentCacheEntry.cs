namespace ShoppingFood.Application.Models
{
    /// <summary>
    /// Cached payment state — survives short polling; authoritative state is DB.
    /// </summary>
    public class PaymentCacheEntry
    {
        public Guid PaymentId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public Guid? OrderId { get; set; }
        public Guid? UserId { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public string? QrImageUrl { get; set; }
    }
}
