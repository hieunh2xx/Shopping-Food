using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class ModerateProductReportCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid ReportId { get; set; }
        public bool IsApproved { get; set; }
        public bool HideProduct { get; set; }
        public string AdminNote { get; set; }
    }
}
