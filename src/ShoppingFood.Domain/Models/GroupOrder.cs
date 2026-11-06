using System;
using System.Collections.Generic;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Domain.Models
{
    /// <summary>Phòng gom đơn: nhiều sinh viên cùng tòa đặt chung một quán để chia phí ship.</summary>
    public class GroupOrder
    {
        public Guid Id { get; set; }
        /// <summary>Mã PIN 6 ký tự để mời bạn bè.</summary>
        public string Code { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public Guid CampusId { get; set; }
        public Guid BuildingId { get; set; }
        public Guid RestaurantId { get; set; }
        public Guid HostUserId { get; set; }
        public GroupDeliveryMode DeliveryMode { get; set; } = GroupDeliveryMode.Room;
        public GroupPaymentMode PaymentMode { get; set; } = GroupPaymentMode.Individual;
        public GroupOrderStatus Status { get; set; } = GroupOrderStatus.Open;
        public int MinMembers { get; set; } = 3;
        public int MaxMembers { get; set; } = 10;
        /// <summary>Snapshot cấu hình phí lúc tạo phòng.</summary>
        public decimal BaseShippingFee { get; set; }
        public decimal SurchargePerMember { get; set; }
        public decimal ShippingFeeTotal { get; set; }
        public decimal ShipperIncome { get; set; }
        public decimal ItemsSubtotal { get; set; }
        public decimal TotalAmount { get; set; }
        public string? Note { get; set; }
        public string? CancelReason { get; set; }
        public Guid? OrderId { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual Campus Campus { get; set; } = null!;
        public virtual CampusBuilding Building { get; set; } = null!;
        public virtual RestaurantProfile Restaurant { get; set; } = null!;
        public virtual User HostUser { get; set; } = null!;
        public virtual Order? Order { get; set; }
        public virtual ICollection<GroupOrderMember> Members { get; set; } = new List<GroupOrderMember>();
    }
}
