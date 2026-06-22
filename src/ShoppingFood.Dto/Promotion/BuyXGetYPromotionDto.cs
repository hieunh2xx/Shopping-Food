using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.Promotion
{
    public class BuyXGetYPromotionDto
    {
        public Guid Id { get; set; }
        public Guid RestaurantId { get; set; }
        public Guid TriggerProductId { get; set; }
        public string TriggerProductName { get; set; } = string.Empty;
        public int BuyQuantity { get; set; }
        public Guid GiftProductId { get; set; }
        public string GiftProductName { get; set; } = string.Empty;
        public int GiftQuantity { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
