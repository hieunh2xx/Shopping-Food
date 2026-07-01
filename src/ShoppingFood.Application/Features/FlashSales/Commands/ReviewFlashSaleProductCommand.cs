using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.FlashSales.Commands
{
    public class ReviewFlashSaleProductCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid FlashSaleProductId { get; set; }
        public bool IsApproved { get; set; }
        public string? RejectionReason { get; set; }
    }
}
