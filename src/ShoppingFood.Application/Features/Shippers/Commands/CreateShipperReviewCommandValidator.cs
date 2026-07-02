using FluentValidation;

namespace ShoppingFood.Application.Features.Shippers.Commands
{
    public class CreateShipperReviewCommandValidator : AbstractValidator<CreateShipperReviewCommand>
    {
        public CreateShipperReviewCommandValidator()
        {
            RuleFor(x => x.OrderId)
                .NotEmpty().WithMessage("OrderId is required.");

            RuleFor(x => x.Rating)
                .InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5.");

            RuleFor(x => x.Comment)
                .MaximumLength(1000).WithMessage("Comment must not exceed 1000 characters.")
                .When(x => x.Comment != null);
        }
    }
}
