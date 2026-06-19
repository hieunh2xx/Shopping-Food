using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Discounts.Commands
{
    public class ApplyDiscountCommandValidator : AbstractValidator<ApplyDiscountCommand>
    {
        public ApplyDiscountCommandValidator()
        {
            RuleFor(x => x.Code).NotEmpty().WithMessage("{PropertyName} is required.");
            RuleFor(x => x.CartAmount).GreaterThanOrEqualTo(0).WithMessage("{PropertyName} must be greater than or equal to 0.");
        }
    }
}
