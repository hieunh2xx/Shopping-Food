using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Domain.Models
{
    public class LoyaltyPointHistory
    {
        public Guid Id { get; set; }
        public Guid UserAccountId { get; set; }
        public int Points { get; set; }
        public PointTransactionType TransactionType { get; set; } 
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual User UserAccount { get; set; } = null!;
    }
}
