using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Restaurants.Commands
{
    public class UpdateRestaurantBasicInfoCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string RestaurantName { get; set; } = string.Empty;
        public string Phone {  get; set; } = string.Empty;
        public string? LogoUrl {  get; set; } 
        public string? BannerUrl { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}
