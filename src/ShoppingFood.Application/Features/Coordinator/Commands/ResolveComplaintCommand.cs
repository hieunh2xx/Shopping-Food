using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class ResolveComplaintCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid ReportId { get; set; }
        public string ResolutionType { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public double PenaltyScore { get; set; } = 10;
    }
}
