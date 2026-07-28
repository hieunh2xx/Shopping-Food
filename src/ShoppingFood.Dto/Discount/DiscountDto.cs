using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
 

namespace ShoppingFood.Dto.Discount
{
    public class DiscountDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; } 
        public string Type { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public decimal MinOrderAmount { get; set; }
        public Guid? RestaurantId { get; set; }
        public string? RestaurantName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int Quantity { get; set; }
        public int UsedCount { get; set; }
        public int MaxUsagePerUser { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsSaved { get; set; }
        public bool IsUsedUp { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
