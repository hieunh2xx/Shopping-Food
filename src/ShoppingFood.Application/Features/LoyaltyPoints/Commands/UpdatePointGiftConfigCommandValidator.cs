using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.LoyaltyPoints.Commands
{
    public class UpdatePointGiftConfigCommandValidator : AbstractValidator<UpdatePointGiftConfigCommand>
    {
        public UpdatePointGiftConfigCommandValidator()
        {
            RuleFor(x => x.PointRequired).GreaterThan(0).WithMessage("{PropertyName} must be greater than 0");
        }
    }
}
