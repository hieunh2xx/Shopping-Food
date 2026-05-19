using System;

namespace ShoppingFood.Dto.Log
{
    public class ErrorLogDto
    {
        public Guid Id { get; set; }
        public string Action { get; set; } = string.Empty;
        public string ExceptionMessage { get; set; } = string.Empty;
        public string? StackTrace { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
