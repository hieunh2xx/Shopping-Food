using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.Discount
{
    public class DiscountStatDto 
    {
        public Guid DiscountId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public int TotalUsed { get; set; }
        public decimal TotalRevenue { get; set; }
        public int Quantity { get; set; }
        public int RemainingQuantity { get; set; }
    }
}
