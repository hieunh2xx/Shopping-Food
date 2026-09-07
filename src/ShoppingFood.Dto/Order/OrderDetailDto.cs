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
        public string? ShipperName { get; set; }
        public string? ShipperPhone { get; set; }
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
        /// <summary>Giảm giá từ mã voucher (không gồm hạng thành viên).</summary>
        public decimal DiscountAmount { get; set; }
        /// <summary>Chiết khấu điểm hạng thành viên.</summary>
        public decimal TierDiscountAmount { get; set; }
        public decimal PlatformCommission { get; set; }
        public decimal SellerPayout { get; set; }
        public decimal ShipperIncome { get; set; }
        public decimal ShipperBaseFeeAmount { get; set; }
        public decimal ShipperDistanceFeeAmount { get; set; }
        public decimal ShipperPeakBonus { get; set; }
        /// <summary>6-char batch pickup code when ≥2 Shipping orders share the same shipper at this restaurant.</summary>
        public string? BatchPickupCode { get; set; }
        /// <summary>Order IDs included in the same batch pickup group (same shipper, Shipping).</summary>
        public List<Guid>? BatchOrderIds { get; set; }
        /// <summary>Readable labels for every bag in the batch (even if not on current page).</summary>
        public List<BatchOrderLabelDto>? BatchOrderLabels { get; set; }
        public List<OrderItemDto> Items { get; set; } = new List<OrderItemDto>();
    }
}
