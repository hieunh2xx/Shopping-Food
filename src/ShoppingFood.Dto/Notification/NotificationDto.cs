using System;

namespace ShoppingFood.Dto.Notification
{
    public class NotificationDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? NotificationType { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreateAt { get; set; }
    }
}
