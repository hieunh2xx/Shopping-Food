using FluentValidation;

namespace ShoppingFood.Application.Features.Restaurants.Commands
{
    public class UpdateRestaurantOperatingHoursCommandValidator : AbstractValidator<UpdateRestaurantOperatingHoursCommand>
    {
        public UpdateRestaurantOperatingHoursCommandValidator()
        {
            RuleFor(p => p.OpeningTime)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .Matches(@"^(?:[01]\d|2[0-3]):[0-5]\d$").WithMessage("{PropertyName} must be in HH:mm format.");

            RuleFor(p => p.ClosingTime)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .Matches(@"^(?:[01]\d|2[0-3]):[0-5]\d$").WithMessage("{PropertyName} must be in HH:mm format.");
        }
    }
}
