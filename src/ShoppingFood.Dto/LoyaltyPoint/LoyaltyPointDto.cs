using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.LoyaltyPoint
{
    public class LoyaltyPointDto
    {
        public Guid UserAccountId { get; set; }
        public int PointsBalance { get; set; }
        public int TotalEarnedPoints { get; set; }
        public string Tier { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; }
        public List<LoyaltyPointHistoryDto> History { get; set; } = new List<LoyaltyPointHistoryDto>();
    }
}
