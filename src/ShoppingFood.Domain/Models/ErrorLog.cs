using System;

namespace ShoppingFood.Domain.Models
{
    public class ErrorLog
    {
        public Guid Id { get; set; }
        public string Action { get; set; } = string.Empty;
        public string ExceptionMessage { get; set; } = string.Empty;
        public string? StackTrace { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
