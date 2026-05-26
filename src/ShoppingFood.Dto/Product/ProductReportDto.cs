using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.Product
{
    public class ProductReportDto
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public Guid Reporter { get; set; }
        public string ReporterName { get; set; } = string.Empty;
        public string Reason {  get; set; } = string.Empty;
        public string? Description {  get; set; } 
        public string Status {  get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } 
    }
}
