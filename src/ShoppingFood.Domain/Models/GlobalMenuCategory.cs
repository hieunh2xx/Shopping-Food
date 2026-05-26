using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Domain.Models
{
    public class GlobalMenuCategory
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description {  get; set; }
        public string? ImageUrl { get; set; }
        public int SortOrder { get; set; } = 0;
        public bool IsHidden { get; set;  } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; }= DateTime.UtcNow;
        public virtual ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
