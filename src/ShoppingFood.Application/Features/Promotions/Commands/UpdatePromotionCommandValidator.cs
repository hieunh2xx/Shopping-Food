using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Promotions.Commands
{
    public class UpdatePromotionCommandValidator : AbstractValidator<UpdatePromotionCommand>
    {
        public UpdatePromotionCommandValidator()
        {
            RuleFor(x => x.Id).NotEmpty().WithMessage("{PropertyName} is required.");
            RuleFor(x => x.TriggerProductId).NotEmpty().WithMessage("{PropertyName} is required.");
            RuleFor(x => x.GiftProductId).NotEmpty().WithMessage("{PropertyName} is required.");
            RuleFor(x => x.BuyQuantity).GreaterThanOrEqualTo(1).WithMessage("{PropertyName} must be at least 1.");
            RuleFor(x => x.GiftQuantity).GreaterThanOrEqualTo(1).WithMessage("{PropertyName} must be at least 1.");
            RuleFor(x => x.StartDate).LessThan(x => x.EndDate).WithMessage("StartDate must be earlier than EndDate.");
        }
    }
}
