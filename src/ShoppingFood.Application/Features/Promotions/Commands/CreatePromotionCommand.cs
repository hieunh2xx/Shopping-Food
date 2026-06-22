using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Promotions.Commands
{
    public class CreatePromotionCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid TriggerProductId { get; set; }
        public int BuyQuantity { get; set; }
        public Guid GiftProductId { get; set; }
        public int GiftQuantity { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
