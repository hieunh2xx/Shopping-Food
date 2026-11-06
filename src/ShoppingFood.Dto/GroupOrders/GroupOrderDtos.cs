using System;
using System.Collections.Generic;

namespace ShoppingFood.Dto.GroupOrders
{
    public class GroupOrderSummaryDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string DeliveryMode { get; set; } = string.Empty;
        public string PaymentMode { get; set; } = string.Empty;
        public Guid CampusId { get; set; }
        public string CampusShortName { get; set; } = string.Empty;
        public Guid BuildingId { get; set; }
        public string BuildingName { get; set; } = string.Empty;
        public string BuildingShortName { get; set; } = string.Empty;
        public Guid RestaurantId { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public string? RestaurantLogoUrl { get; set; }
        public string HostName { get; set; } = string.Empty;
        public int MemberCount { get; set; }
        public int MinMembers { get; set; }
        public int MaxMembers { get; set; }
        /// <summary>Phí ship / người hiện tại (theo số người đã có, tối thiểu MinMembers).</summary>
        public decimal ShippingSharePerMember { get; set; }
        public decimal SurchargePerMember { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid? OrderId { get; set; }
        public string? OrderStatus { get; set; }
        public bool IsMember { get; set; }
    }

    public class GroupOrderDetailDto : GroupOrderSummaryDto
    {
        public string CampusName { get; set; } = string.Empty;
        public string? BuildingDropPoint { get; set; }
        public bool BuildingAllowRoomDelivery { get; set; }
        public Guid HostUserId { get; set; }
        public string? Note { get; set; }
        public string? CancelReason { get; set; }
        public decimal BaseShippingFee { get; set; }
        public decimal SingleRoomDeliveryFee { get; set; }
        public decimal ItemsSubtotal { get; set; }
        public decimal ShippingFeeTotal { get; set; }
        public decimal ShipperIncome { get; set; }
        public decimal TotalAmount { get; set; }
        /// <summary>Phí ship / người tạm thu khi thanh toán (tính theo số người tối thiểu).</summary>
        public decimal PrepayShippingShare { get; set; }
        public int ActiveMemberCount { get; set; }
        public int PaidMemberCount { get; set; }
        public bool IsHost { get; set; }
        public bool CanSubmit { get; set; }
        public string? SubmitBlockReason { get; set; }
        public bool RestaurantIsOpen { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public Guid? MyMemberId { get; set; }
        public List<GroupOrderMemberDto> Members { get; set; } = new();
    }

    public class GroupOrderMemberDto
    {
        public Guid Id { get; set; }
        public Guid UserAccountId { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string? Phone { get; set; }
        public string? RoomNumber { get; set; }
        public string? Note { get; set; }
        public bool IsHost { get; set; }
        public bool IsMe { get; set; }
        public decimal ItemsSubtotal { get; set; }
        public decimal ShippingShare { get; set; }
        public decimal AmountDue { get; set; }
        public decimal PrepayAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public Guid? PaidByUserId { get; set; }
        public string? PaidByName { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public DateTime JoinedAt { get; set; }
        public List<GroupOrderItemDto> Items { get; set; } = new();
    }

    /// <summary>Thông tin gom đơn gắn với một Order — dùng cho màn nhà hàng và shipper.</summary>
    public class GroupOrderForOrderDto
    {
        public Guid OrderId { get; set; }
        public Guid GroupOrderId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string DeliveryMode { get; set; } = string.Empty;
        public string CampusName { get; set; } = string.Empty;
        public string BuildingName { get; set; } = string.Empty;
        public string? BuildingDropPoint { get; set; }
        public int Floors { get; set; }
        public string? Note { get; set; }
        public int PortionCount { get; set; }
        public int DeliveredCount { get; set; }
        public decimal ShippingFeeTotal { get; set; }
        public decimal ShipperIncome { get; set; }
        public decimal ItemsSubtotal { get; set; }
        public bool IsPrepaid { get; set; } = true;
        public string? OrderStatus { get; set; }
        public bool CanMarkDelivered { get; set; }
        public List<GroupOrderPortionDto> Portions { get; set; } = new();
    }

    public class GroupOrderPortionDto
    {
        public Guid MemberId { get; set; }
        public int Index { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? RoomNumber { get; set; }
        public string? Note { get; set; }
        public bool IsHost { get; set; }
        public decimal ItemsSubtotal { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public List<GroupOrderItemDto> Items { get; set; } = new();
    }

    public class GroupOrderItemDto
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public string? SelectedSize { get; set; }
        public string? SelectedToppings { get; set; }
        public string? Note { get; set; }
    }

    public class GroupOrderMenuItemDto
    {
        public Guid Id { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public string? CategoryName { get; set; }
        public bool IsAvailable { get; set; }
        public List<GroupOrderMenuSizeDto> Sizes { get; set; } = new();
        public List<GroupOrderMenuToppingDto> Toppings { get; set; } = new();
    }

    public class GroupOrderMenuSizeDto
    {
        public string SizeName { get; set; } = string.Empty;
        public decimal ExtraPrice { get; set; }
        public bool IsDefault { get; set; }
    }

    public class GroupOrderMenuToppingDto
    {
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public bool IsAvailable { get; set; }
    }

    public class GroupOrderRestaurantDto
    {
        public Guid Id { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public double AverageRating { get; set; }
        public bool IsOpen { get; set; }
        public double? DistanceKm { get; set; }
        public int OpenGroupCount { get; set; }
    }
}
