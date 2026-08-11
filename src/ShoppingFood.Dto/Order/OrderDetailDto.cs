using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.Order
{
    public class OrderDetailDto 
    {
        public Guid Id { get; set; }
        public Guid? UserAccountId { get; set; }
        public Guid? GuestUserId { get; set; }
        public Guid? ShipperId { get; set; }
        public decimal TotalAmount { get; set; }
        public string DeliveryAddress { get; set; } = string.Empty;
        public string ContactName { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string? Note { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public double? DeliveryLatitude { get; set; }
        public double? DeliveryLongitude { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool CanCancel { get; set; }
        public bool CanMessageSeller { get; set; }
        public Guid? RestaurantId { get; set; }
        public string? RestaurantName { get; set; }
        public Guid? OrderChatSessionId { get; set; }
        public string? OrderChatSessionStatus { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public Guid? PaymentSessionId { get; set; }
        public string? DiscountCode { get; set; }
        public string? RejectReason { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal ItemsSubtotal { get; set; }
        public decimal ShipperIncome { get; set; }
        public decimal ShipperBaseFeeAmount { get; set; }
        public decimal ShipperDistanceFeeAmount { get; set; }
        public decimal ShipperPeakBonus { get; set; }
        public List<OrderItemDto> Items { get; set; } = new List<OrderItemDto>();
    }
}
