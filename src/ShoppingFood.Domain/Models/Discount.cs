using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Domain.Models
{
    public class Discount
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DiscountType Type { get; set; } = DiscountType.FixedAmount;
        public decimal Value { get; set; } // % hoặc số tiền
        public decimal? MaxDiscountAmount { get; set; } // số tiền giảm tối đa nếu là %
        public decimal MinOrderAmount { get; set; } = 0; // giá trị đơn hàng tối thiểu để áp dụng

        public Guid? RestaurantId { get; set; } // == null: mã toàn hệ thống admin tạo // != null mã của nhà hàng seller tạo
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int Quantity { get; set; }
        public int UsedCount { get; set; } = 0;
        public int MaxUsagePerUser { get; set; } = 1;

        public DiscountStatus Status { get; set; } = DiscountStatus.Active;
        public bool IsDeleted { get; set; } = false;
        public DateTime DeletedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set;} = DateTime.UtcNow;

        public virtual RestaurantProfile? Restaurant { get; set; }
    }
}
