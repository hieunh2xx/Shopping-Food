using System;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Domain.Models
{
    /// <summary>Tòa nhà / KTX / cổng trên sơ đồ trường. Map* là phần trăm (0–100) trên khung sơ đồ.</summary>
    public class CampusBuilding
    {
        public Guid Id { get; set; }
        public Guid CampusId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string ShortName { get; set; } = string.Empty;
        public CampusBuildingType BuildingType { get; set; } = CampusBuildingType.Dormitory;
        public string? Zone { get; set; }
        public string? Description { get; set; }
        /// <summary>Điểm giao khi giao sảnh (vd. "Bàn lễ tân tầng 1").</summary>
        public string? DropPoint { get; set; }
        public int Floors { get; set; } = 1;
        public bool AllowRoomDelivery { get; set; } = true;
        public double MapX { get; set; }
        public double MapY { get; set; }
        public double MapWidth { get; set; } = 10;
        public double MapHeight { get; set; } = 8;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual Campus Campus { get; set; } = null!;
    }
}
