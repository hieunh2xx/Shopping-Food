using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.Product
{
    public class GlobalMenuCategoryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description {  get; set; }
        public string? ImageUrl { get; set; }
        public int SortOrder { get; set; }
    }
}
