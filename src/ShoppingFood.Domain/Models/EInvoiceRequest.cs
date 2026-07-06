using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Domain.Models
{
    public class EInvoiceRequest
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public Guid UserAccountId { get; set; }
        public string TaxCode { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string CompanyAddress { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public InvoiceStatus Status { get; set; } = InvoiceStatus.Pending;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual Order Order { get; set; } = null!;
    }
}
