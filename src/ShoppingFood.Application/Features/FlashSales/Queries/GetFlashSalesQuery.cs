using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.FlashSales.Queries
{
    public class GetFlashSalesQuery : BaseQuery, IRequest<ApiResponse>
    {
        public FlashSaleStatus? Status { get; set; }
    }
}
