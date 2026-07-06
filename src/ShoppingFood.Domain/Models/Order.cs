using System;
using System.Collections.Generic;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Domain.Models
{
    public class Order
    {
        public Guid Id { get; set; }
        public Guid? UserAccountId { get; set; }
        public Guid? GuestUserId { get; set; }
        public Guid? ShipperId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal ShippingFee { get; set; } = 0;
        public string DeliveryAddress { get; set; } = string.Empty;
        public string ContactName { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string? Note { get; set; }
        public string? RejectReason { get; set; }
        public string? DeliveryProofImageUrl { get; set; }
        public OrderStatus Status { get; set; } = OrderStatus.Pending;
        public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.COD;
        public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
        public decimal ItemsSubtotal { get; set; } = 0;
        public decimal PlatformCommission { get; set; } = 0;
        public decimal SellerPayout { get; set; } = 0;
        public bool IsFinancialSettled { get; set; } = false;
        public Guid? PaymentSessionId { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public double? DeliveryLatitude { get; set; }
        public double? DeliveryLongitude { get; set; }
        public Guid? AppliedDiscountId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User? UserAccount { get; set; }
        public virtual GuestUser? GuestUser { get; set; }
        public virtual ShipperProfile? Shipper { get; set; }
        public virtual ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
        public virtual Discount? AppliedDiscount { get; set; } 
    }
}
