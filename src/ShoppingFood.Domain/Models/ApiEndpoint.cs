using System;

namespace ShoppingFood.Domain.Models
{
    public class ApiEndpoint
    {
        public Guid Id { get; set; }
        public string Path { get; set; } = string.Empty;
        public string Method { get; set; } = string.Empty; 
        public string Name { get; set; } = string.Empty;
        public string? Module { get; set; }
        public bool IsPublished { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
