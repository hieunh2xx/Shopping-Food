using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Domain.Models
{
    public class ProductSize
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string SizeName { get; set; } = string.Empty;
        public decimal ExtraPrice { get; set; }
        public bool IsDefault { get; set; }

        // Navigation property
        public virtual Product Product { get; set; } = null!;
    }
}
