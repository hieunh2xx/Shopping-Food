using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class SendCheckoutOtpCommandValidator : AbstractValidator<SendCheckoutOtpCommand>
    {
        public SendCheckoutOtpCommandValidator()
        {
            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull();

            RuleFor(x => x.Phone)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull()
                .Matches(@"^\d{9,15}$").WithMessage("Phone number must contain 9 to 15 digits.");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .EmailAddress().WithMessage("Invalid email format.");

            RuleFor(x => x.DeliveryAddress)
                .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.GuestUserId)
                .NotEmpty().WithMessage("{PropertyName} is required.");
        }
    }
}
