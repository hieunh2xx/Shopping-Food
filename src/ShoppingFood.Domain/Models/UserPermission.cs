using System;

namespace ShoppingFood.Domain.Models
{
    public class UserPermission
    {
        public Guid Id { get; set; }
        public Guid UserAccountId { get; set; }
        public Guid ApiEndpointId { get; set; }
        public bool IsGranted { get; set; } = true; 
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual User UserAccount { get; set; } = null!;
        public virtual ApiEndpoint ApiEndpoint { get; set; } = null!;
    }
}
