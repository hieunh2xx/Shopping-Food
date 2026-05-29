using System;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Domain.Models
{
    public class UserProfile
    {
        public Guid Id { get; set; }
        public Guid UserAccountId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public UserRole Role { get; set; } = UserRole.Customer;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User UserAccount { get; set; } = null!;
    }
}
