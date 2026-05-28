using System;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Domain.Models
{
    public class RolePermission
    {
        public Guid Id { get; set; }
        public UserRole Role { get; set; }
        public Guid ApiEndpointId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual ApiEndpoint ApiEndpoint { get; set; } = null!;
    }
}
