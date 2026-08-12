using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.Order
{
    public class ShipperIncomeReportDto
    {
        public int CompletedOrdersCount { get; set; }
        public decimal TotalBaseFees { get; set; }
        public decimal TotalDistanceFees { get; set; }
        public decimal TotalBonuses { get; set; }
        public decimal TotalIncome { get; set; }
        public List<DailyIncomeReportDto> DailyReports { get; set; } = new List<DailyIncomeReportDto>();
        public List<ShipperCompletedOrderDto> Orders { get; set; } = new List<ShipperCompletedOrderDto>();
        public int OrdersTotalCount { get; set; }
        public int Skip { get; set; }
        public int Take { get; set; }
    }

    public class DailyIncomeReportDto
    {
        public string Date { get; set; } = string.Empty;
        public int CompletedOrdersCount { get; set; }
        public decimal BaseFees { get; set; }
        public decimal DistanceFees { get; set; }
        public decimal Bonus { get; set; }
        public decimal TotalIncome { get; set; }
    }

    public class ShipperCompletedOrderDto
    {
        public Guid OrderId { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal ItemsSubtotal { get; set; }
        public decimal BaseFee { get; set; }
        public decimal DistanceFee { get; set; }
        public decimal PeakBonus { get; set; }
        public decimal TotalIncome { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string DeliveryAddress { get; set; } = string.Empty;
        public string ContactName { get; set; } = string.Empty;
        public DateTime CompletedAt { get; set; }
    }
}
