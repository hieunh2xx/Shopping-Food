using System;

namespace ShoppingFood.Dto.User
{
    public class SellerApplicationDto
    {
        public Guid Id { get; set; }
        public Guid UserProfileId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string BusinessName { get; set; } = string.Empty;
        public string BusinessAddress { get; set; } = string.Empty;
        public string BusinessLicenseUrl { get; set; } = string.Empty;
        public string ShopImageUrl { get; set; } = string.Empty;
        public string ContactInfo { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? ReviewedAt { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
