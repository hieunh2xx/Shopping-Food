using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using System;

namespace ShoppingFood.Application.Features.Shippers.Commands
{
    public class ReportOrderIncidentCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid OrderId { get; set; }
        public ReportTargetType TargetType { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }
}
