using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Restaurants.Commands
{
    public class UpdateRestaurantOperatingHoursCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string OpeningTime { get; set; } = "08:00";
        public string ClosingTime { get; set; } = "22:00";
    }
}
