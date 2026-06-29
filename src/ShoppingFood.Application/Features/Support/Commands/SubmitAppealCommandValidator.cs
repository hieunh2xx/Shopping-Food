using FluentValidation;

namespace ShoppingFood.Application.Features.Support.Commands
{
    public class SubmitAppealCommandValidator : AbstractValidator<SubmitAppealCommand>
    {
        public SubmitAppealCommandValidator()
        {
            RuleFor(x => x.Content)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(2000).WithMessage("{PropertyName} must not exceed 2000 characters.");
        }
    }
}
