using FluentValidation;

namespace ShoppingFood.Application.Features.Carts.Queries
{
    public class RemoveCartItemQueryValidator : AbstractValidator<RemoveCartItemQuery>
    {
        public RemoveCartItemQueryValidator()
        {
            RuleFor(p => p.ProductId)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull();
        }
    }
}
