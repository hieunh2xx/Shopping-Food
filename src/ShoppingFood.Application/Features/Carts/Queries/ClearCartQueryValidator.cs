using FluentValidation;

namespace ShoppingFood.Application.Features.Carts.Queries
{
    public class ClearCartQueryValidator : AbstractValidator<ClearCartQuery>
    {
        public ClearCartQueryValidator()
        {
        }
    }
}
