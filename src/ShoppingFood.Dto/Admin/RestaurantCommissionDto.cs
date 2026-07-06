using System;

namespace ShoppingFood.Dto.Admin
{
    public class RestaurantCommissionDto
    {
        public Guid RestaurantId { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public decimal? CustomCommissionRate { get; set; }
    }
}
