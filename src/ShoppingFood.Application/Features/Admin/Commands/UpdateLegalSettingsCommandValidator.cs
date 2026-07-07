using FluentValidation;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class UpdateLegalSettingsCommandValidator : AbstractValidator<UpdateLegalSettingsCommand>
    {
        public UpdateLegalSettingsCommandValidator()
        {
            RuleFor(x => x.TermsOfUseCustomer)
                .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.TermsOfUseSeller)
                .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.TermsOfUseShipper)
                .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.PrivacyPolicy)
                .NotEmpty().WithMessage("{PropertyName} is required.");
        }
    }
}
