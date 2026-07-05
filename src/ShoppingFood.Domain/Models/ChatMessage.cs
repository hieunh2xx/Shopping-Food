using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Domain.Models
{
    public class ChatMessage
    {
        public Guid Id {  get; set; }
        public Guid SessionId { get; set; }
        public Guid SenderId { get; set; }
        public UserRole SenderRole { get; set; } 
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual ChatSession Session { get; set; } = null!;
        public virtual User Sender { get; set; } = null!;
    }
}
