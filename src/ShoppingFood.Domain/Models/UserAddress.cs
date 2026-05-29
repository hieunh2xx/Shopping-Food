using System;

namespace ShoppingFood.Domain.Models
{
    public class UserAddress
    {
        public Guid Id { get; set; }
        public Guid UserAccountId { get; set; }
        public string ContactName { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string AddressLine { get; set; } = string.Empty;
        public bool IsDefault { get; set; } = false;

        public virtual User? UserAccount { get; set; }
    }
}
