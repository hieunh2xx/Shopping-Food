using System;

namespace ShoppingFood.Domain.Models
{
    public class ShipperReputationHistory
    {
        public Guid Id { get; set; }
        public Guid ShipperProfileId { get; set; }
        public Guid? OrderId { get; set; }
        public double PointChange { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ShipperProfile ShipperProfile { get; set; } = null!;
        public virtual Order? Order { get; set; }
    }
}
