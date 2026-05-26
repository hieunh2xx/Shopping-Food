using FluentValidation;
using ShoppingFood.Repository.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Toppings.Commands
{
    public class CreateToppingCommandValidator : AbstractValidator<CreateToppingCommand>
    {
        private readonly IToppingRepository _toppingRepository;

        public CreateToppingCommandValidator(IToppingRepository toppingRepository)
        {
            _toppingRepository = toppingRepository;

            RuleFor(x => x.RestaurantId)
                .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.ToppingName)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(100).WithMessage("{PropertyName} must not exceed 100 characters.");

            RuleFor(x => x.Price)
                .GreaterThanOrEqualTo(0).WithMessage("{PropertyName} must be greater than or equal to 0.");

            RuleFor(x => x)
                .MustAsync(BeUniqueNameInRestaurant).WithMessage("A topping with this name already exists in this restaurant.");
        }

        private async Task<bool> BeUniqueNameInRestaurant(CreateToppingCommand command, CancellationToken token)
        {
            var existing = await _toppingRepository.GetAsync(t =>
                t.RestaurantId == command.RestaurantId &&
                t.ToppingName.ToLower() == command.ToppingName.ToLower());
            return existing.Count == 0;
        }
    }
}
