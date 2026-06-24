using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.LoyaltyPoint
{
    public class PointGiftConfigDto
    {
        public Guid Id { get; set; }
        public Guid DiscountId { get; set; }
        public int PointRequired { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public string DiscountCode { get; set; } = string.Empty;
        public string DiscountTitle { get; set; } = string.Empty;
        public string DiscountType { get; set; } = string.Empty;
        public decimal DiscountValue { get; set; }
        public decimal MinOrderAmount { get; set; }
    }
}
