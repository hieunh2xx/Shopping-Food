using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.Order
{
    public class ProposedDeliveryOfferDto
    {
        public Guid OrderId { get; set; }
        public decimal TotalAmount { get; set; }
        public string DeliveryAddress { get; set; } = string.Empty;
        public string ContactName { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string? Note { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public string RestaurantAddress { get; set; } = string.Empty;
        public string RestaurantPhone { get; set; } = string.Empty;
        public double? RestaurantLatitude { get; set; }
        public double? RestaurantLongitude { get; set; }
        public double DistanceInKm { get; set; }
        public decimal TotalIncome { get; set; }
        public decimal BaseFee { get; set; }
        public decimal DistanceFee { get; set; }
        public decimal PeakBonus { get; set; }
        public int CountdownSeconds { get; set; } = 60;
        public List<OrderItemDto> Items { get; set; } = new List<OrderItemDto>();
    }
}
