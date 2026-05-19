using System;
using System.Collections.Generic;

namespace ShoppingFood.Domain.Models
{
    public class Cart
    {
        public Guid Id { get; set; }
        public Guid? UserAccountId { get; set; }
        public Guid? GuestUserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User? UserAccount { get; set; }
        public virtual GuestUser? GuestUser { get; set; }
        public virtual ICollection<CartItem> Items { get; set; } = new List<CartItem>();
    }
}
