using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Carts.Commands
{
    public class AddToCartCommandValidator : AbstractValidator<AddToCartCommand>
    {
        public AddToCartCommandValidator()
        {
            RuleFor(x => x.ProductId)
                .NotEmpty().WithMessage("{PropertyName} is required.");
                
            RuleFor(x => x.Quantity)
                .GreaterThan(0).WithMessage("{PropertyName} must be at least 1.");
        }
    }
}
