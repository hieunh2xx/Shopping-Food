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

            RuleFor(x => x.DeliveryLatitude)
                .InclusiveBetween(-90.0, 90.0).When(x => x.DeliveryLatitude.HasValue)
                .WithMessage("Latitude must be between -90 and 90.");
            RuleFor(x => x.DeliveryLongitude)
                .InclusiveBetween(-180.0, 180.0).When(x => x.DeliveryLongitude.HasValue)
                .WithMessage("Longitude must be between -180 and 180.");
        }
    }
}
