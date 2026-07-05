using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Domain.Models
{
    public class ChatSession
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid? SupportId { get; set; }
        public ChatTopic Topic { get; set; }
        public ChatSessionStatus Status { get; set; } = ChatSessionStatus.Open;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ClosedAt { get; set; }

        public virtual User User { get; set; } = null!;
        public virtual User? Support {  get; set; }
        public virtual ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }
}
