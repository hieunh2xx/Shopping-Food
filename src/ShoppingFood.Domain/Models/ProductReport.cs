using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Domain.Models
{
    public class ProductReport
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public Guid ReporterId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Description {  get; set; }
        public ProductReportStatus Status { get; set; } = ProductReportStatus.Pending;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set;} = DateTime.UtcNow;

        public virtual Product Product { get; set; } = null!;
        public virtual UserProfile Reporter { get; set; } = null!;
    }
}
