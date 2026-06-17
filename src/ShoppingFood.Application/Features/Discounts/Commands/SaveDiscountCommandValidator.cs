using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Discounts.Commands
{
    public class SaveDiscountCommandValidator : AbstractValidator<SaveDiscountCommand>
    {
        public SaveDiscountCommandValidator()
        {
            RuleFor(x => x.DiscountId).NotEmpty().WithMessage("{PropertyName} is required.");
        }
    }
}
