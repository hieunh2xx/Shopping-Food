using FluentValidation;

namespace ShoppingFood.Application.Features.Restaurants.Commands
{
    public class UpdateRestaurantBasicInfoCommandValidator : AbstractValidator<UpdateRestaurantBasicInfoCommand>
    {
        public UpdateRestaurantBasicInfoCommandValidator()
        {
            RuleFor(p => p.RestaurantName)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(150).WithMessage("{PropertyName} must not exceed 150 characters.");

            RuleFor(p => p.Phone)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .Matches(@"^\d{9,15}$").WithMessage("Phone number must contain 9 to 15 digits.");

            RuleFor(p => p.Address)
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.");

            RuleFor(p => p.LogoUrl)
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.")
                .Must(url => string.IsNullOrEmpty(url) || HasValidImageExtension(url))
                .WithMessage("{PropertyName} must be a valid image file (.jpg, .jpeg, .png, .webp).");

            RuleFor(p => p.BannerUrl)
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.")
                .Must(url => string.IsNullOrEmpty(url) || HasValidImageExtension(url))
                .WithMessage("{PropertyName} must be a valid image file (.jpg, .jpeg, .png, .webp).");

            RuleFor(p => p.Latitude)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .InclusiveBetween(-90.0, 90.0).WithMessage("Latitude must be between -90 and 90.");

            RuleFor(p => p.Longitude)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .InclusiveBetween(-180.0, 180.0).WithMessage("Longitude must be between -180 and 180.");
        }

        private bool HasValidImageExtension(string url)
        {
            if (string.IsNullOrEmpty(url)) return false;
            var cleanUrl = url.Split('?')[0];
            var ext = Path.GetExtension(cleanUrl).ToLower();
            return ext is ".jpg" or ".jpeg" or ".png" or ".webp";
        }
    }
}
