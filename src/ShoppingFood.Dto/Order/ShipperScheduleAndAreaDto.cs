using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.Order
{
    public class ShipperScheduleAndAreaDto
    {
        public double? OperatingLatitude { get; set; }
        public double? OperatingLongitude { get; set; }
        public double? OperatingRadiusKm { get; set; }
        public List<WorkingScheduleItemDto> WorkingSchedule { get; set; } = new List<WorkingScheduleItemDto>();
    }

    public class WorkingScheduleItemDto 
    {
        public DayOfWeek DayOfWeek {  get; set; }
        public string From { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty;
    }
}
