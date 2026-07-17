using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class ApproveApplicationCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid ApplicationId { get; set; }
        public string Action { get; set; } = string.Empty; // "Approve", "Reject", "NeedsInfo"
        public string RejectionReason { get; set; } = string.Empty;
    }
}
