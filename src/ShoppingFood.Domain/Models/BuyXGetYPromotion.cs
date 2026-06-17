using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Domain.Models
{
    public class BuyXGetYPromotion 
    {
        public Guid Id { get; set; }
        public Guid RestaurantId { get; set; }
        public Guid TriggerProductId { get; set; }
        public int BuyQuantity { get; set; } = 1; // số lượng cần mua
        public Guid GiftProductId { get; set; }
        public int GiftQuantity { get; set; } // số lượng được tặng
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual RestaurantProfile Restaurant { get; set; } = null!;
        public virtual Product TriggerProduct { get; set; } = null!;
        public virtual Product GiftProduct { get;set; } = null!;
    }
}
