using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Discounts.Commands
{
    public class UpdateDiscountCommandValidator : AbstractValidator<UpdateDiscountCommand>
    {
        public UpdateDiscountCommandValidator()
        {
            RuleFor(x => x.Id).NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.Title).NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(200).WithMessage("{PropertyName} must not exceed 200 characters.");

            RuleFor(x => x.Value).GreaterThan(0).WithMessage("{PropertyName} must be greater than 0.");

            RuleFor(x => x.MinOrderAmount).GreaterThanOrEqualTo(0).WithMessage("{PropertyName} must be greater than or equal to 0.");

            RuleFor(x => x.Quantity).GreaterThan(0).WithMessage("{PropertyName} must be greater than 0.");

            RuleFor(x => x.MaxUsagePerUser).GreaterThan(0).WithMessage("{PropertyName} must be greater than 0.");

            RuleFor(x => x.EndDate).GreaterThan(x => x.StartDate).WithMessage("{PropertyName} must be greater than StartDate.");
        }
    }
}
