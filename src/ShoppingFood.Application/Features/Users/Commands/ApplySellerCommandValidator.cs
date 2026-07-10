using FluentValidation;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class ApplySellerCommandValidator : AbstractValidator<ApplySellerCommand>
    {
        public ApplySellerCommandValidator()
        {
            RuleFor(p => p.BusinessName)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(150).WithMessage("{PropertyName} must not exceed 150 characters.");

            RuleFor(p => p.BusinessAddress)
               .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(v => v.ContactInfo)
                .NotEmpty().WithMessage("Contact Info is required.")
                .MaximumLength(100).WithMessage("Contact Info must not exceed 100 characters.");

            RuleFor(p => p.BusinessLicenseUrl)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.")
                .Must(url => HasValidExtension(url, ".jpg", ".jpeg", ".png", ".webp", ".pdf", ".doc", ".docx"))
                .WithMessage("BusinessLicenseUrl must point to a valid image or document file (.jpg, .jpeg, .png, .webp, .pdf, .doc, .docx).");

            RuleFor(p => p.ShopImageUrl)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.")
                .Must(url => HasValidExtension(url, ".jpg", ".jpeg", ".png", ".webp"))
                .WithMessage("ShopImageUrl must point to a valid image file (.jpg, .jpeg, .png, .webp).");
        }

        private bool HasValidExtension(string url, params string[] allowedExtensions)
        {
            if (string.IsNullOrEmpty(url)) return false;
            var cleanUrl = url.Split('?')[0];
            var extension = Path.GetExtension(cleanUrl).ToLower();
            return Enumerable.Contains(allowedExtensions, extension);
        }
    }
}
