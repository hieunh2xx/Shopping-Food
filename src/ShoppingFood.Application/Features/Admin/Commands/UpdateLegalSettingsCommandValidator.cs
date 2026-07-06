using FluentValidation;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class UpdateLegalSettingsCommandValidator : AbstractValidator<UpdateLegalSettingsCommand>
    {
        public UpdateLegalSettingsCommandValidator()
        {
            RuleFor(x => x.TermsOfUse)
                .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.PrivacyPolicy)
                .NotEmpty().WithMessage("{PropertyName} is required.");
        }
    }
}
