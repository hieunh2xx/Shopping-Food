using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class CreateProductReviewCommandValidator : AbstractValidator<CreateProductReviewCommand>
    {
        public CreateProductReviewCommandValidator() {
            RuleFor(p => p.ProductId)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull();

            RuleFor(p => p.Rating)
                .InclusiveBetween(1, 5).WithMessage("{PropertyName} must be between 1 and 5 starts.");

            RuleFor(p => p.Comment)
                .MaximumLength(1000).WithMessage("{PropertyName} must not exceed 1000 characters.");
        }
    }
}
