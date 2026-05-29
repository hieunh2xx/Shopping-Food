using FluentValidation;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class ApplySellerCommandValidator : AbstractValidator<ApplySellerCommand>
    {
        public ApplySellerCommandValidator()
        {
            RuleFor(v => v.BusinessName)
                .NotEmpty().WithMessage("Business Name is required.")
                .MaximumLength(100).WithMessage("Business Name must not exceed 100 characters.");

            RuleFor(v => v.BusinessAddress)
                .NotEmpty().WithMessage("Business Address is required.")
                .MaximumLength(200).WithMessage("Business Address must not exceed 200 characters.");

            RuleFor(v => v.ContactInfo)
                .NotEmpty().WithMessage("Contact Info is required.")
                .MaximumLength(50).WithMessage("Contact Info must not exceed 50 characters.");
        }
    }
}
