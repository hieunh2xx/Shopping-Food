using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class ReportReviewCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid ReviewId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
