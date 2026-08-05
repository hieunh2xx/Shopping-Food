using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.Restaurant
{
    public class FavoriteRestaurantDto
    {
        public Guid RestaurantId { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string Address { get; set; } = string.Empty;
        public DateTime FavoritedAt { get; set; }
        public bool IsMall { get; set; }
    }
}
