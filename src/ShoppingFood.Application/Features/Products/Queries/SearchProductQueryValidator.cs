using FluentValidation;
using ShoppingFood.Application.Features.Products.Queries;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class SearchProductQueryValidator : AbstractValidator<SearchProductQuery>
    {
        public SearchProductQueryValidator()
        {
            RuleFor(x => x.MinPrice).GreaterThanOrEqualTo(0);
            RuleFor(x => x.MaxPrice).GreaterThanOrEqualTo(0);
            RuleFor(x => x)
                .Must(x => x.MaxPrice >= x.MinPrice)
                .When(x => x.MinPrice.HasValue && x.MaxPrice.HasValue)
                .WithMessage("The maximum price must be greater than or equal to the minimum price.");
        }
    }
}
