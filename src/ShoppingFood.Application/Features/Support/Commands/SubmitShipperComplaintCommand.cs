using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Support.Commands
{
    public class SubmitShipperComplaintCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid OrderId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string EvidenceImageUrl { get; set; } = string.Empty;
    }
}
