using System;
using System.Collections.Generic;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Domain.Models
{
    public class GroupOrderMember
    {
        public Guid Id { get; set; }
        public Guid GroupOrderId { get; set; }
        public Guid UserAccountId { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? RoomNumber { get; set; }
        public string? Note { get; set; }
        public bool IsHost { get; set; }
        public decimal ItemsSubtotal { get; set; }
        public decimal ShippingShare { get; set; }
        /// <summary>Số tiền đã trừ ví (tạm tính ship theo số người tối thiểu).</summary>
        public decimal PaidAmount { get; set; }
        public GroupMemberPaymentStatus PaymentStatus { get; set; } = GroupMemberPaymentStatus.Unpaid;
        /// <summary>Người trả tiền (chính thành viên hoặc trưởng nhóm trả hộ).</summary>
        public Guid? PaidByUserId { get; set; }
        public DateTime? PaidAt { get; set; }
        /// <summary>Shipper đã giao phần này tới phòng / điểm nhận của thành viên.</summary>
        public DateTime? DeliveredAt { get; set; }
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        public virtual GroupOrder GroupOrder { get; set; } = null!;
        public virtual User UserAccount { get; set; } = null!;
        public virtual ICollection<GroupOrderItem> Items { get; set; } = new List<GroupOrderItem>();
    }
}
