using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Domain.Models
{
    public class Notification
    {
        public Guid Id  { get; set; }
        public Guid UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public NotificationType? NotificationType { get; set; } 
        public bool IsRead { get; set; } = false;
        public DateTime CreateAt { get; set; } = DateTime.UtcNow;

        public virtual User User { get; set; } = null!;
    }
}
