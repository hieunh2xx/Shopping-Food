using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Domain.Models
{
    public class MemberTierConfig
    {
        public Guid Id { get; set; }
        public MemberTier Tier { get; set; }
        public int MinPoints { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
