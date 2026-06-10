using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Order;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class UpdateShipperScheduleAndAreaCommand : BaseCommand, IRequest<ApiResponse>
    {
        public double? OperatingLatitude { get; set; }
        public double? OperatingLongitude { get; set; }
        public double? OperatingRadiusKm { get; set; }
        public List<WorkingScheduleItemDto> WorkingSchedule { get; set; } = new List<WorkingScheduleItemDto>();
    }
}
