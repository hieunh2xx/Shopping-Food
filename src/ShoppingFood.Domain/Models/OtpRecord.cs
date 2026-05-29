using System;

namespace ShoppingFood.Domain.Models
{
    public class OtpRecord
    {
        public Guid Id { get; set; }
        public string EmailOrPhone { get; set; } = string.Empty;
        public string OtpCode { get; set; } = string.Empty;
        public DateTime ExpiryTime { get; set; }
        public int RetriesCount { get; set; } = 0;
        public string IpAddress { get; set; } = string.Empty;
        public bool IsUsed { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
