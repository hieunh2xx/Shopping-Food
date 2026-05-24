using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class UpdateProductAvailabilityCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid Id { get; set; }
        public TimeSpan? AvailableFrom { get; set; }
        public TimeSpan? AvailableTo { get; set; }

    }
}
