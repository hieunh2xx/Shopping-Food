using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Restaurants.Commands
{
    public class ToggleFavoriteRestaurantCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid RestaurantId { get; set; }
        public ToggleFavoriteRestaurantCommand(Guid restaurantId)
        {
            RestaurantId = restaurantId;
        }
    }
}
