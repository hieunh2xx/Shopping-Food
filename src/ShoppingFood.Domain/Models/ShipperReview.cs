using System;

namespace ShoppingFood.Domain.Models
{
    public class ShipperReview
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }           // 1 đơn chỉ review 1 lần
        public Guid ShipperProfileId { get; set; }
        public Guid ReviewerAccountId { get; set; } // UserAccount của customer
        public int Rating { get; set; }             // 1–5
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Order Order { get; set; } = null!;
        public virtual ShipperProfile ShipperProfile { get; set; } = null!;
        public virtual User Reviewer { get; set; } = null!;
    }
}
