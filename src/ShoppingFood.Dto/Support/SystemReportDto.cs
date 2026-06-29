using System;

namespace ShoppingFood.Dto.Support
{
    public class SystemReportDto
    {
        public Guid Id { get; set; }
        public Guid ReporterId { get; set; }
        public string ReporterName { get; set; } = string.Empty;
        public Guid? TargetId { get; set; }
        public string TargetType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Content { get; set; } 
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } 
    }
}
