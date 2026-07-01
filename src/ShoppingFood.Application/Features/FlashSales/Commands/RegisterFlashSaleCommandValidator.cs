using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.FlashSales.Commands
{
    public class RegisterFlashSaleCommandValidator : AbstractValidator<RegisterFlashSaleCommand>
    {
        public RegisterFlashSaleCommandValidator()
        {
            RuleFor(x => x.FlashSaleId)
                .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.ProductId)
                .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.FlashSalePrice)
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than 0.");

            RuleFor(x => x.QuantityLimit)
                .GreaterThan(0).WithMessage("{PropertyName} must be at least 1.");
        }
    }
}
