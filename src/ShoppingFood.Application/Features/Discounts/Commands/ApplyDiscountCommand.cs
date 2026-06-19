using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Discounts.Commands
{
    public class ApplyDiscountCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string Code { get; set; } = string.Empty;
        public Guid? RestaurantId { get; set; }
        public decimal CartAmount { get; set; }
    }
}
