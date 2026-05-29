using System;

namespace ShoppingFood.Domain.Models
{
    public class TrustedDevice
    {
        public Guid Id { get; set; }
        public Guid UserAccountId { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public DateTime TrustedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(30);

        // Navigation property
        public virtual User? UserAccount { get; set; }
    }
}
