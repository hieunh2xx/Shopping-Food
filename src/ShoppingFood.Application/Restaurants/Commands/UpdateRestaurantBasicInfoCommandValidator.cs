using FluentValidation;

namespace ShoppingFood.Application.Restaurants.Commands
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

            RuleFor(p => p.LogoUrl)
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.");

            RuleFor(p => p.BannerUrl)
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.");
        }
    }
}
