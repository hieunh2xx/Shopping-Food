using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class ModerateReviewCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid ReportId { get; set; }
        public bool IsApproved { get; set; }
        public string? AdminNote { get; set; }

    }
}
