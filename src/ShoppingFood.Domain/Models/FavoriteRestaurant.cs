using Microsoft.Identity.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Domain.Models
{
    public class FavoriteRestaurant
    {
        public Guid UserProfileId { get; set; }
        public Guid RestaurantId { get; set; }
        public DateTime CreatedAt { get; set; }

        public virtual UserProfile UserProfile { get; set; } = null!;
        public virtual RestaurantProfile RestaurantProfile { get; set;} = null!;
    }
}
