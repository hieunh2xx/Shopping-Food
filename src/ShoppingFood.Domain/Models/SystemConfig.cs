using System;
using System.ComponentModel.DataAnnotations;

namespace ShoppingFood.Domain.Models
{
    public class SystemConfig
    {
        [Key]
        public string Key { get; set; } = string.Empty;
        
        public string? Value { get; set; }
        
        public string? Description { get; set; }
        
        public DateTime? UpdatedAt { get; set; }
    }
}
