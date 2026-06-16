using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class ReleaseOrderCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid OrderId { get; set; }
        public Guid? NewShipperId { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
