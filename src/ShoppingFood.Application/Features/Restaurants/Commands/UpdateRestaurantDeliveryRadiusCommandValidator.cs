using FluentValidation;

namespace ShoppingFood.Application.Features.Restaurants.Commands
{
    public class UpdateRestaurantDeliveryRadiusCommandValidator : AbstractValidator<UpdateRestaurantDeliveryRadiusCommand>
    {
        public UpdateRestaurantDeliveryRadiusCommandValidator()
        {
            RuleFor(p => p.MaxDeliveryRadiusKm)
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than 0.");
        }
    }
}
