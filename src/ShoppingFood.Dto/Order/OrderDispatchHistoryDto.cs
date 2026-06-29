using System;

namespace ShoppingFood.Dto.Order
{
    public class OrderDispatchHistoryDto
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public Guid ActorId { get; set; }
        public string ActorName { get; set; } = string.Empty;
        public string ActorRole { get; set; } = string.Empty;
        public string ActionType { get; set; } = string.Empty;
        public Guid? TargetShipperId { get; set; }
        public string? TargetShipperName { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
