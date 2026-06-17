using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Domain.Models
{
    public class PointGiftConfig
    {
        public Guid Id { get; set; }
        public Guid DiscountId { get; set; }
        public int PointRequired { get; set; }
        public bool IsActive { get; set; }
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual Discount Discount { get; set; } = null!;
    }
}
