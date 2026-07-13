using System;

namespace ShoppingFood.Dto.Coordinator
{
    public class OrderComplaintDto
    {
        public Guid ReportId { get; set; }
        public string ReporterName { get; set; } = string.Empty;
        public string RestaurantName { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public decimal OrderTotalAmount { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
