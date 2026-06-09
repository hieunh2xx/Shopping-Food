using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.Order
{
    public class DeliveryRouteDto
    {
        public Guid OrderId { get; set; }
        public double? ShipperLatitude { get; set; }
        public double? ShipperLongitude { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public string RestaurantAddress { get; set; } = string.Empty;
        public double? RestaurantLatitude { get; set; } 
        public double? RestaurantLongitude { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerAddress { get; set;} = string.Empty;
        public string CustomerPhone { get; set;} = string.Empty;
        public double? CustomerLatitude { get; set; }
        public double? CustomerLongitude { get; set; }
        public string GoogleMapNavigationUrl { get; set; } = string.Empty;
    }
}
