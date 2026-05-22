using System;

namespace ShoppingFood.Dto.Product
{
    public class MenuCategoryDto
    {
        public Guid Id { get; set; }
        public Guid RestaurantId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int SortOrder { get; set; }
        public int ProductCount { get; set; }
    }
}
