using ShoppingFood.Domain.Enums;
using System;

namespace ShoppingFood.Domain.Models
{
    /// <summary>
    /// Yêu cầu shipper nộp tiền COD thu hộ về nền tảng — chờ Admin/Điều phối duyệt.
    /// </summary>
    public class CodRemittanceRequest
    {
        public Guid Id { get; set; }
        public Guid ShipperProfileId { get; set; }
        public decimal Amount { get; set; }
        public string? Note { get; set; }
        public string? ProofImageUrl { get; set; }
        public CodRemittanceStatus Status { get; set; } = CodRemittanceStatus.Pending;
        public Guid? ReviewedByUserId { get; set; }
        public string? RejectReason { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual ShipperProfile ShipperProfile { get; set; } = null!;
    }
}
