using System;

namespace ShoppingFood.Dto.User
{
    public class UserDto
    {
        public Guid Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Email { get; set; }
        public bool IsEmailActive { get; set; }
        public string? Phone { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Tier { get; set; }
        public int TotalEarnedPoints { get; set; }
        public int PointsBalance { get; set; }
        public SellerInfoDto? SellerInfo { get; set; }
    }

    public class SellerInfoDto
    {
        public Guid RestaurantId { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public string? LogoUrl { get; set; }
        public string DeliveryType { get; set; } = string.Empty;
    }
}
