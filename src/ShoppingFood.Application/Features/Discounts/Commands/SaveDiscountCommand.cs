using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Discounts.Commands
{
    public class SaveDiscountCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid DiscountId { get;set; }
    }
}
