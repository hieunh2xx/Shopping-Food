using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Promotions.Commands
{
    public class DeletePromotionCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid Id { get; set; }
        public DeletePromotionCommand(Guid id)
        {
            Id = id;
        }
    }
}
