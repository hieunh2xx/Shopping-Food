namespace ShoppingFood.Application.Models
{
    public class SepayTransactionRecord
    {
        public string Id { get; set; } = string.Empty;
        public string TransferType { get; set; } = string.Empty;
        public decimal AmountIn { get; set; }
        public string? TransactionContent { get; set; }
        public string? Code { get; set; }
        public string? ReferenceNumber { get; set; }
        public DateTime? TransactionDate { get; set; }
        public int? WebhookSuccess { get; set; }
    }
}
