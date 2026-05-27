using FluentValidation;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class UpdateSellerApplicationCommandValidator : AbstractValidator<UpdateSellerApplicationCommand>
    {
        public UpdateSellerApplicationCommandValidator()
        {
            RuleFor(p => p.Id)
                .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(p => p.BusinessName)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(150).WithMessage("{PropertyName} must not exceed 150 characters.");

            RuleFor(p => p.BusinessAddress)
                .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(p => p.BusinessLicenseUrl)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.");

            RuleFor(p => p.ShopImageUrl)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.");

            RuleFor(p => p.ContactInfo)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(100).WithMessage("{PropertyName} must not exceed 100 characters.");
        }
    }
}
