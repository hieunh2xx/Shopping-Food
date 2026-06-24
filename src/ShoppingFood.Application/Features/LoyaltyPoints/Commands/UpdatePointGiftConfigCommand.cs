using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.LoyaltyPoints.Commands
{
    public class UpdatePointGiftConfigCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid Id { get; set; }
        public int PointRequired { get; set; }
        public bool IsActive { get; set; }
    }
}
