using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.FlashSales.Commands
{
    public class UpdateFlashSaleCommandValidator : AbstractValidator<UpdateFlashSaleCommand>
    {
        public UpdateFlashSaleCommandValidator()
        {
            RuleFor(x => x.Id).NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(200).WithMessage("{PropertyName} must not exceed 200 characters.");

            RuleFor(x => x.StartDate)
                .GreaterThan(DateTime.UtcNow).WithMessage("{PropertyName} must be in the future.")
                .LessThan(x => x.EndDate).WithMessage("{PropertyName} must be earlier than EndDate.");

            RuleFor(x => x.EndDate)
                .GreaterThan(x => x.StartDate).WithMessage("{PropertyName} must be later than StartDate.");
        }
    }
}
