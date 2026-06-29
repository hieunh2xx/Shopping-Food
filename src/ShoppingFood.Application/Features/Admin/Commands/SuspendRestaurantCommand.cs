using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class SuspendRestaurantCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid RestaurantId { get; set; }
        public string? Reason { get; set; }
        public bool IsSuspended { get; set; }
    }
}
