using MediatR;
using System;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class UpdateRestaurantCommissionCommand : IRequest<bool>
    {
        public Guid RestaurantId { get; set; }
        public decimal? CustomCommissionRate { get; set; }
    }
}
