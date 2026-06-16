using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class SuspendShipperCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid ShipperId { get; set; }
        public int DurationMinutes { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
