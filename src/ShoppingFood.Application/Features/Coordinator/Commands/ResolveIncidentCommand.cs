using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class ResolveIncidentCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid OrderId { get; set; }
        public string ResolutionType { get; set; } = string.Empty;  // CustomerFault, ShipperFault, ForceCancelNoPenalty
        public string Notes { get; set; } = string.Empty;
        public double PenaltyScore { get; set; } = 10;
    }
}
