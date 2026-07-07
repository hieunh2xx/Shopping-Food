using System;

namespace ShoppingFood.Dto.Admin
{
    public class ApiEndpointDto
    {
        public Guid Id { get; set; }
        public string Method { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsPublished { get; set; }
        public string? Module { get; set; }
    }
}
