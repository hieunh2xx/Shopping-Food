using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class CheckoutCommandValidator : AbstractValidator<CheckoutCommand>
    {
        public CheckoutCommandValidator()
        {
            RuleFor(x => x.DeliveryAddress)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull();
            RuleFor(x => x.ContactName)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull();
            RuleFor(x => x.ContactPhone)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull()
                .Matches(@"^\d{9,15}$").WithMessage("Phone number must contain 9 to 15 digits.");

            RuleFor(x => x.ContactEmail)
                .NotEmpty().When(x => !x.CurrentUserId.HasValue).WithMessage("{PropertyName} is required.")
                .EmailAddress().When(x => !x.CurrentUserId.HasValue).WithMessage("Invalid email format.");

            RuleFor(x => x.OtpCode)
                .NotEmpty().When(x => !x.CurrentUserId.HasValue).WithMessage("{PropertyName} is required.");
        }
    }
}
