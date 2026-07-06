using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class ToggleRestaurantVerificationCommand : IRequest<ApiResponse>
    {
        public Guid RestaurantId { get; set; }
    }
}
