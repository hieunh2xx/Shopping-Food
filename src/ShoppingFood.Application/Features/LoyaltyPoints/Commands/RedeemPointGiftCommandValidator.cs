using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.LoyaltyPoints.Commands
{
    public class RedeemPointGiftCommandValidator : AbstractValidator<RedeemPointGiftCommand>
    {
        public RedeemPointGiftCommandValidator()
        {
            RuleFor(x => x.PointGiftConfigId).NotEmpty().WithMessage("{PropertyName} is required.");
        }
    }
}
