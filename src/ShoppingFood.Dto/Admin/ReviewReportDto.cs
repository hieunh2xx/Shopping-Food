using System;

namespace ShoppingFood.Dto.Admin
{
    public class ReviewReportDto
    {
        public Guid Id { get; set; }
        public Guid ReporterId { get; set; }
        public string ReporterName { get; set; } = string.Empty;
        public Guid? TargetId { get; set; }
        public string Reason { get; set; } = string.Empty; // Mapped from Title
        public string? Description { get; set; } // Mapped from Content
        public string? ReviewContent { get; set; } // Fetched from ProductReview.Comment
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
