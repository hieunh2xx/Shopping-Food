using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Domain.Models
{
    public class LoyaltyPoint
    {
        public Guid UserAccountId { get; set; }
        public int PointsBalance { get; set; } = 0; // số điểm khả dụng
        public int TotalEarnedPoints { get; set; } = 0; // tổng đã tích lũy (để xếp hạng thành viên)

        public MemberTier Tier { get; set; } = MemberTier.Bronze;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual User UserAccount { get; set; } = null!;
    }
}
