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
        public decimal TotalShippingFees { get; set; }
        public decimal TotalBonuses { get; set; }
        public decimal TotalIncome { get; set; }
        public List<DailyIncomeReportDto> DailyReports { get; set; } = new List<DailyIncomeReportDto>();
    }

    public class DailyIncomeReportDto
    {
        public string Date { get; set; } = string.Empty;
        public int CompletedOrdersCount { get; set; }
        public decimal ShippingFees { get; set; }
        public decimal Bonus {  get; set; }
        public decimal TotalIncome { get; set; }
    }
}
