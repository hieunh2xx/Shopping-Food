using FluentValidation;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class AddSellerCommandValidator : AbstractValidator<AddSellerCommand>
    {
        private readonly IUserRepository _userRepository;

        public AddSellerCommandValidator(IUserRepository userRepository)
        {
            _userRepository = userRepository;

            RuleFor(p => p.UserName)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull()
                .MaximumLength(50).WithMessage("{PropertyName} must not exceed 50 characters.")
                .MustAsync(async (username, token) => !await _userRepository.ExistsAsync(u => u.UserName == username))
                .WithMessage("UserName already exists.");

            RuleFor(p => p.Password)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MinimumLength(6).WithMessage("{PropertyName} must be at least 6 characters.");

            RuleFor(p => p.Email)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .EmailAddress().WithMessage("A valid email address is required.")
                .MustAsync(async (email, token) => !await _userRepository.ExistsAsync(u => u.Email == email))
                .WithMessage("Email already exists.");

            RuleFor(p => p.Phone)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .Matches(@"^\d{10}$").WithMessage("Phone number must contain 10 digits.")
                .MustAsync(async (phone, token) => !await _userRepository.ExistsAsync(u => u.Phone == phone))
                .WithMessage("Phone number already exists.");

            RuleFor(p => p.BusinessName)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(150).WithMessage("{PropertyName} must not exceed 150 characters.");

            RuleFor(p => p.BusinessAddress)
                .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(p => p.BusinessLicenseUrl)
                 .NotEmpty().WithMessage("{PropertyName} is required.")
                 .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.")
                 .Must(url => HasValidExtension(url, ".jpg", ".jpeg", ".png", ".webp", ".pdf", ".doc", ".docx"))
                 .WithMessage("BusinessLicenseUrl must point to a valid image or document file (.jpg, .jpeg, .png, .webp, .pdf, .doc, .docx).");

             RuleFor(p => p.FoodSafetyCertificateUrl)
                 .NotEmpty().WithMessage("{PropertyName} is required.")
                 .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.")
                 .Must(url => HasValidExtension(url, ".jpg", ".jpeg", ".png", ".webp", ".pdf", ".doc", ".docx"))
                 .WithMessage("FoodSafetyCertificateUrl must point to a valid image or document file (.jpg, .jpeg, .png, .webp, .pdf, .doc, .docx).");
 
             RuleFor(p => p.ShopImageUrl)
                 .NotEmpty().WithMessage("{PropertyName} is required.")
                 .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.")
                 .Must(url => HasValidExtension(url, ".jpg", ".jpeg", ".png", ".webp"))
                 .WithMessage("ShopImageUrl must point to a valid image file (.jpg, .jpeg, .png, .webp).");
 
             RuleFor(p => p.ContactInfo)
                 .NotEmpty().WithMessage("{PropertyName} is required.")
                 .MaximumLength(100).WithMessage("{PropertyName} must not exceed 100 characters.");
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
