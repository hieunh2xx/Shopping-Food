using FluentValidation;
using System.Linq;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class ConfirmPickedUpBatchCommandValidator : AbstractValidator<ConfirmPickedUpBatchCommand>
    {
        public ConfirmPickedUpBatchCommandValidator()
        {
            RuleFor(x => x.OrderIds)
                .NotEmpty().WithMessage("At least one order is required.")
                .Must(ids => ids != null && ids.Distinct().Count() == ids.Count)
                .WithMessage("Duplicate order IDs are not allowed.");

            RuleFor(x => x.VerificationCode)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .Length(6).WithMessage("{PropertyName} must be exactly 6 characters.");

            RuleFor(x => x.Latitude)
                .InclusiveBetween(-90.0, 90.0).WithMessage("Latitude must be between -90 and 90.");

            RuleFor(x => x.Longitude)
                .InclusiveBetween(-180.0, 180.0).WithMessage("Longitude must be between -180 and 180.");
        }
    }
}
