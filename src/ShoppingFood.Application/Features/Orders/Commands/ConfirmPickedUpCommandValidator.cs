using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class ConfirmPickedUpCommandValidator : AbstractValidator<ConfirmPickedUpCommand>
    {
        public ConfirmPickedUpCommandValidator()
        {
            RuleFor(x => x.OrderId)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull();

            RuleFor(x => x.VerificationCode)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .Length(6).WithMessage("{PropertyName} must be exactly 6 characters.");
        }
    }
}
