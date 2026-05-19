using System;
using ShoppingFood.Core.Interfaces;

namespace ShoppingFood.Domain.Models
{
    public class ActionLog : IActionLog
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Guid? CreatedBy { get; set; }
    }
}
