using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Domain.Models
{
    public class CustomerDiscount
    {
        public Guid Id { get; set; }
        public Guid UserAccountId { get; set; }
        public Guid DiscountId { get; set; }

        public int UsageCount = 0; // số lần khách hàng đã dùng mã này
        public DateTime SavedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual User UserAccount { get; set; } = null!;
        public virtual Discount Discount { get; set; } = null!;
    }
}
