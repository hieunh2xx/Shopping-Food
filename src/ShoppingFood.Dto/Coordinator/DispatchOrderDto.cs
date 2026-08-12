using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.Coordinator
{
    public class DispatchOrderDto 
    {
        public Guid Id { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal ShippingFee { get; set; }
        public string DeliveryAddress { get; set; } = string.Empty;
        public string ContactName { get; set; } = string.Empty;
        public string ContactPhone { get; set;  } = string.Empty;
        public string? Note { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public DateTime CreatedAt = DateTime.UtcNow;
        public DateTime UpdatedAt = DateTime.UtcNow;

        public string RestaurantName { get; set; } = string.Empty;
        public string RestaurantAddress { get;set; } = string.Empty;
        public Guid? RestaurantId { get; set; }
        
        public Guid? ShipperId { get; set; }
        public string? ShipperName { get;set;  } 
        public string? ShipperPhone { get; set; }

        /// <summary>Batch pickup when this shipper has ≥2 Shipping orders at the same restaurant.</summary>
        public string? BatchPickupCode { get; set; }
        public int BatchBagCount { get; set; }
        public List<ShoppingFood.Dto.Order.BatchOrderLabelDto>? BatchOrderLabels { get; set; }

        public List<DispatchOrderItemDto> Items { get; set; } = new();
    }
    
    public class DispatchOrderItemDto
    {
        public string ItemName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public bool IsGift { get; set; }
    }
}
