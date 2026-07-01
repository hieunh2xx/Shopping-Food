using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.FlashSales.Commands
{
    public class RegisterFlashSaleCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid FlashSaleId { get; set; }
        public Guid ProductId { get; set; }
        public decimal FlashSalePrice { get; set; }
        public int QuantityLimit { get; set; }
    }
}
