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
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.")
                .Must(url => HasValidImageExtension(url, true))
                .WithMessage("{PropertyName} must point to a valid image or document file (.jpg, .jpeg, .png, .webp, .pdf, .doc, .docx).");

            RuleFor(p => p.ShopImageUrl)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.")
                .Must(url => HasValidImageExtension(url, false))
                .WithMessage("{PropertyName} must point to a valid image file (.jpg, .jpeg, .png, .webp).");

            RuleFor(p => p.ContactInfo)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(100).WithMessage("{PropertyName} must not exceed 100 characters.");
        }

        private bool HasValidImageExtension(string url, bool allowDocs = false)
        {
            if (string.IsNullOrEmpty(url)) return false;
            var cleanUrl = url.Split('?')[0];
            var ext = Path.GetExtension(cleanUrl).ToLower();
            
            if (allowDocs)
            {
                return ext is ".jpg" or ".jpeg" or ".png" or ".webp" or ".pdf" or ".doc" or ".docx";
            }
            return ext is ".jpg" or ".jpeg" or ".png" or ".webp";
        }
    }
}
