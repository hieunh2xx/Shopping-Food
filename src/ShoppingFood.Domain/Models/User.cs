using System;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Domain.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public string? UserName { get; set; }
        public string PasswordHash { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public bool IsEmailActive { get; set; } = false;
        public UserStatus Status { get; set; } = UserStatus.Pending;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }
        public DateTime? DeleteRequestedAt { get; set; }

        // Navigation property
        public virtual UserProfile? Profile { get; set; }
    }
}
