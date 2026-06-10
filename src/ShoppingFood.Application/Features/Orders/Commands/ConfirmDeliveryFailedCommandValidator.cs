using FluentValidation;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class ConfirmDeliveryFailedCommandValidator : AbstractValidator<ConfirmDeliveryFailedCommand>
    {
        public ConfirmDeliveryFailedCommandValidator()
        {
            RuleFor(x => x.OrderId)
                .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.Reason)
                .NotEmpty().WithMessage("{PropertyName} is required")
                .NotNull()
                .MaximumLength(500).WithMessage("{PropertyName} must not exceed 500 characters");

            RuleFor(x => x.Latitude)
                .InclusiveBetween(-90.0, 90.0).WithMessage("Latitude must be between -90 and 90.");

            RuleFor(x => x.Longitude)
                .InclusiveBetween(-180.0, 180.0).WithMessage("Longitude must be between -180 and 180.");
        }
    }
}
