using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Domain.Models
{
    public class OrderDispatchHistory
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public Guid ActorId { get; set; }
        public string ActorName { get; set; } = string.Empty;
        public string ActorRole { get; set; } = string.Empty;
        public DispatchActionType ActionType { get; set; }
        public Guid? TargetShipperId { get; set; }
        public string? TargetShipperName { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public virtual Order Order { get; set; } = null!;
    }
}
