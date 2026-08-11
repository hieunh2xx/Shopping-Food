using ShoppingFood.Domain.Enums;
using System;

namespace ShoppingFood.Domain.Models
{
    public class OrderExplanationRequest
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public Guid RequestedByProfileId { get; set; }
        public string RequestMessage { get; set; } = string.Empty;
        public ExplanationRequestStatus Status { get; set; } = ExplanationRequestStatus.Pending;
        public string? ShipperReply { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RepliedAt { get; set; }

        public virtual Order Order { get; set; } = null!;
        public virtual UserProfile RequestedBy { get; set; } = null!;
    }
}
