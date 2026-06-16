using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.Coordinator
{
    public class MonitorShipperDto
    {
        public Guid ShipperId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string VehicleType { get; set; } = string.Empty;
        public string VehiclePlateNumber { get; set; } = string.Empty;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public bool IsOnline { get; set; }
        public string Status { get; set; } = string.Empty;
        public double ReputationScore { get; set; }
        public double Rating { get; set; }
        public bool IsBusy { get; set; }
        public int CompletedOrderCount { get; set; }
    }
}
