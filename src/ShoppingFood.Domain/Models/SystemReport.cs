using ShoppingFood.Domain.Enums;
using System;

namespace ShoppingFood.Domain.Models
{
    public class SystemReport
    {
        public Guid Id { get; set; }
        public Guid ReporterId { get; set; }
        public Guid? TargetId { get; set; } 
        public ReportTargetType TargetType { get; set; }
        public string Title { get; set; } = string.Empty; 
        public string? Content { get; set; }
        public ReportStatus Status { get; set; } = ReportStatus.Pending;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual UserProfile Reporter { get; set; } = null!;
    }
}
