using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class UpdateProductStockCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid Id { get; set; }
        public StockStatus StockStatus { get; set; }
    }
}
