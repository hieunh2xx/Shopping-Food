using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class ReportReviewCommandValidator : AbstractValidator<ReportReviewCommand>
    {
        public ReportReviewCommandValidator()
        {
            RuleFor(x => x.ReviewId)
                .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.Reason)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(200).WithMessage("{PropertyName} must not exceed 200 characters.");

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("{PropertyName} must not exceed 1000 characters.")
                .When(x => x.Description != null);
        }
    }
}
