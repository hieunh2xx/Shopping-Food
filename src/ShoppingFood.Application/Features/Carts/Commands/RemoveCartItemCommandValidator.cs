using FluentValidation;

namespace ShoppingFood.Application.Features.Carts.Commands
{
    public class RemoveCartItemCommandValidator : AbstractValidator<RemoveCartItemCommand>
    {
        public RemoveCartItemCommandValidator()
        {
            RuleFor(p => p.ProductId)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull();
        }
    }
}
