using System;
using System.Collections.Generic;

namespace ShoppingFood.Dto.GroupOrders
{
    public class CampusDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string ShortName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? Description { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public int MinGroupMembers { get; set; }
        public int MaxGroupMembers { get; set; }
        public decimal GroupBaseShippingFee { get; set; }
        public decimal LobbySurchargePerMember { get; set; }
        public decimal RoomSurchargePerMember { get; set; }
        public decimal SingleRoomDeliveryFee { get; set; }
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
        public int OpenGroupCount { get; set; }
        public List<CampusBuildingDto> Buildings { get; set; } = new();
    }

    public class CampusBuildingDto
    {
        public Guid Id { get; set; }
        public Guid CampusId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string ShortName { get; set; } = string.Empty;
        public string BuildingType { get; set; } = string.Empty;
        public string? Zone { get; set; }
        public string? Description { get; set; }
        public string? DropPoint { get; set; }
        public int Floors { get; set; }
        public bool AllowRoomDelivery { get; set; }
        public double MapX { get; set; }
        public double MapY { get; set; }
        public double MapWidth { get; set; }
        public double MapHeight { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
        public int OpenGroupCount { get; set; }
    }
}
