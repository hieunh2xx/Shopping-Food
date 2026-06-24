using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.LoyaltyPoints.Commands
{
    public class RedeemPointGiftCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid PointGiftConfigId { get; set; }
    }
}
