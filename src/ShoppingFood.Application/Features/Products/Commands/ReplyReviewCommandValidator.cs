using FluentValidation;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class ReplyReviewCommandValidator : AbstractValidator<ReplyReviewCommand>
    {
        public ReplyReviewCommandValidator()
        {
            RuleFor(x => x.ReviewId)
                .NotEmpty().WithMessage("ReviewId is required.");

            RuleFor(x => x.Reply)
                .NotEmpty().WithMessage("Reply is required.")
                .MaximumLength(1000).WithMessage("Reply must not exceed 1000 characters.");
        }
    }
}
