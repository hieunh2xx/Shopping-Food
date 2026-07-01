using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.FlashSales.Commands
{
    public class ReviewFlashSaleProductCommandValidator : AbstractValidator<ReviewFlashSaleProductCommand>
    {
        public ReviewFlashSaleProductCommandValidator()
        {
            RuleFor(x => x.FlashSaleProductId)
                .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.RejectionReason)
                .NotEmpty().WithMessage("{PropertyName} is required")
                .When(x => !x.IsApproved);
        }
    }
}
