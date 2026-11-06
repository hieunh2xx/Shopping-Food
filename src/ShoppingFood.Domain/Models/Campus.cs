using System;
using System.Collections.Generic;

namespace ShoppingFood.Domain.Models
{
    /// <summary>Khuôn viên trường (FPTU Hòa Lạc, ĐHQG...) dùng cho gom đơn nội khu.</summary>
    public class Campus
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string ShortName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? Description { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public int MinGroupMembers { get; set; } = 3;
        public int MaxGroupMembers { get; set; } = 10;
        /// <summary>Phí ship cơ bản cho cả đơn gom (quán → trường), chia đều cho thành viên.</summary>
        public decimal GroupBaseShippingFee { get; set; } = 15000;
        /// <summary>Phụ phí mỗi người khi shipper mang vào sảnh tầng 1 của tòa.</summary>
        public decimal LobbySurchargePerMember { get; set; } = 3000;
        /// <summary>Phụ phí mỗi người khi shipper giao tận phòng (leo tầng).</summary>
        public decimal RoomSurchargePerMember { get; set; } = 8000;
        /// <summary>Phí ship tham khảo khi đặt lẻ giao tận phòng — dùng để hiển thị mức tiết kiệm.</summary>
        public decimal SingleRoomDeliveryFee { get; set; } = 25000;
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual ICollection<CampusBuilding> Buildings { get; set; } = new List<CampusBuilding>();
    }
}
