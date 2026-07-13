using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class ResolveComplaintCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid ReportId { get; set; }
        public ComplaintResolutionType ResolutionType { get; set; }
        public string Notes { get; set; } = string.Empty;
        public double PenaltyScore { get; set; } = 10;
        public decimal RefundAmount { get; set; } = 0;
        public decimal DeductionAmount { get; set; } = 0;
        public string? ResponsibleParty { get; set; }
    }
}
