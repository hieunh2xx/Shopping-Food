using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.Coordinator
{
    public class IncidentItemDto
    {
        public Guid Id { get; set; }
        public string IncidentType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public Guid? OrderId { get; set; }
        public Guid? ReportId { get; set; }
        public Guid? ShipperProfileId { get; set; }
        public string ContactName { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
